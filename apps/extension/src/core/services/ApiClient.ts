import type { AgentResult, QueryRequest, QueryResponse } from '@flowforge/contract';
import { constants } from '#self/constants';

export interface ApiClient {
    query(request: QueryRequest): Promise<QueryResponse>;
}

// Regular Http API client

export class HttpApiClient implements ApiClient {
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

// Demo API client

interface DemoApiClientOptions {
    delayMs?: number;
    stubModel?: string;
    stubQA?: {
        question: string;
        result: AgentResult;
    }[];
}

export class DemoApiClient implements ApiClient {
    private readonly delayMs: number;
    private readonly metadataModel: string;
    private readonly qaMap: Map<string, AgentResult>;

    constructor(options: DemoApiClientOptions = {}) {
        this.delayMs = options.delayMs ?? 0;
        this.metadataModel = options.stubModel ?? 'demo-model';
        this.qaMap = new Map(options.stubQA?.map((s) => [s.question, s.result]) ?? []);
    }

    async query(request: QueryRequest): Promise<QueryResponse> {
        await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        if (!this.qaMap.has(request.question)) {
            throw new Error(`Could not mapped a result for question: ${request.question}`);
        }
        return {
            result: this.qaMap.get(request.question)!,
            metadata: {
                execTimeMs: this.delayMs,
                model: this.metadataModel,
                usage: {
                    inputTokens: 0,
                    outputTokens: 0,
                    totalTokens: Math.floor(Math.random() * (5000 - 100 + 1)) + 100,
                },
            },
        };
    }
}
