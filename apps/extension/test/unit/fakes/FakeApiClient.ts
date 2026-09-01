import type { QueryRequest, QueryResponse } from '@flowforge/contract';
import type { ApiClient } from '@/core/services/ApiClient.ts';

export class FakeApiClient implements ApiClient {
    readonly requests: QueryRequest[] = [];

    private response: QueryResponse | Error;

    constructor(response: QueryResponse | Error = createQueryResponseFixture()) {
        this.response = response;
    }

    async query(request: QueryRequest): Promise<QueryResponse> {
        this.requests.push(request);
        if (this.response instanceof Error) {
            throw this.response;
        }
        return this.response;
    }

    setResponse(response: QueryResponse | Error): void {
        this.response = response;
    }
}

export function createQueryResponseFixture(overrides: Partial<QueryResponse> = {}): QueryResponse {
    return {
        result: {
            answer: 'Test answer',
            elements: [],
            mode: 'direct',
            topic: null,
        },
        metadata: {
            model: 'test-model',
            usage: {
                inputTokens: 1,
                outputTokens: 2,
                totalTokens: 3,
            },
            execTimeMs: 4,
        },
        ...overrides,
    };
}
