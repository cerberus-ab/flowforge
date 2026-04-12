import type { QueryRequest, QueryResponse } from '@flowforge/shared';
import { constants } from '#self/constants';

export class ApiClient {
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async query(request: QueryRequest): Promise<QueryResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), constants.API_QUERY_TIMEOUT_MS);

        try {
            const response = await fetch(`${this.baseUrl}/query`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message ?? `Server error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof DOMException && error.name === 'AbortError') {
                throw new Error('Request timeout. Please try again.');
            }
            if (error instanceof TypeError) {
                throw new Error('Network error. Make sure the backend server is running.');
            }
            throw error instanceof Error ? error : new Error('Unknown error');
        }
    }
}
