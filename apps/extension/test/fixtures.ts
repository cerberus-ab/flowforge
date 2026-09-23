import type { QueryResponse } from '@flowforge/contract';
import type { ExtensionSettings } from '@/types';

export function createSettingsFixture(overrides: Partial<ExtensionSettings> = {}): ExtensionSettings {
    return {
        theme: 'light',
        devMode: false,
        ...overrides,
    };
}

export function createQueryResponseFixture(overrides: Partial<QueryResponse> = {}): QueryResponse {
    return {
        result: {
            answer: 'Backend response',
            elements: [],
            mode: 'direct',
            topic: null,
            ...overrides.result,
        },
        metadata: {
            model: 'test-backend',
            execTimeMs: 0,
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
            },
            ...overrides.metadata,
        },
    };
}
