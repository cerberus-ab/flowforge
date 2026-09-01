import type { PageTrail, QueryResponse } from '@flowforge/contract';
import type { ExtensionSettings } from '@/types';

export function createSettingsFixture(overrides: Partial<ExtensionSettings> = {}): ExtensionSettings {
    return {
        theme: 'light',
        devMode: false,
        ...overrides,
    };
}

export function createPageTrailFixture(overrides: Partial<PageTrail> = {}): PageTrail {
    return {
        basics: {
            url: 'https://app.flowforge.test',
            title: 'Test app',
            description: '',
            language: 'en',
            viewport: {
                width: 1280,
                height: 720,
                scrollY: 0,
                scrollHeight: 720,
            },
        },
        structure: [],
        content: [],
        interactive: [],
        metadata: {
            structureElements: 0,
            structureMaxDepth: 0,
            contentElements: 0,
            contentElementsTotal: 0,
            contentElementsLimitReached: false,
            interactiveElements: 0,
            interactiveElementsTotal: 0,
            interactiveElementsLimitReached: false,
            collectedAt: 0,
            performance: {
                basicsMs: 0,
                structureMs: 0,
                contentMs: 0,
                interactiveMs: 0,
                totalMs: 0,
            },
        },
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
