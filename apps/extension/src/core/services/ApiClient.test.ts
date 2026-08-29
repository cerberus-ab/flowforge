import type { AgentResult, QueryRequest } from '@flowforge/contract';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createPageTrailFixture } from '../../../test/fakes/fixtures';
import { constants } from '@/constants';
import { DemoApiClient, HttpApiClient } from './ApiClient';

const result: AgentResult = {
    answer: 'Open settings from the sidebar.',
    elements: [
        {
            text: 'Settings',
            dataId: 'flowforge-target',
            cssSelector: '[data-flowforge-id="flowforge-target"]',
            action: 'click',
        },
    ],
    mode: 'direct',
    topic: 'settings',
};

const request: QueryRequest = {
    question: 'How do I open settings?',
    domain: 'example.com',
    pageTrail: createPageTrailFixture(),
};

afterEach(() => {
    vi.useRealTimers();
});

describe('HttpApiClient', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    it('posts query requests and returns the parsed response', async () => {
        const response = {
            result,
            metadata: {
                model: 'test-model',
                execTimeMs: 12,
                usage: {
                    inputTokens: 1,
                    outputTokens: 2,
                    totalTokens: 3,
                },
            },
        };
        vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(response), { status: 200 }));

        await expect(new HttpApiClient('https://api.example.com').query(request)).resolves.toEqual(response);

        expect(fetch).toHaveBeenCalledWith('https://api.example.com/query', {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(request),
            signal: expect.any(AbortSignal),
        });
    });

    it('uses the server error message when a non-ok response contains one', async () => {
        vi.mocked(fetch).mockResolvedValue(
            new Response(JSON.stringify({ message: 'Invalid page trail' }), {
                status: 400,
            }),
        );

        await expect(new HttpApiClient('https://api.example.com').query(request)).rejects.toThrow('Invalid page trail');
    });

    it('falls back to the response status when a non-ok response has no JSON message', async () => {
        vi.mocked(fetch).mockResolvedValue(new Response('not json', { status: 503 }));

        await expect(new HttpApiClient('https://api.example.com').query(request)).rejects.toThrow('Server error: 503');
    });

    it('converts fetch type errors to an actionable network error', async () => {
        vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(new HttpApiClient('https://api.example.com').query(request)).rejects.toThrow(
            'Network error. Make sure the backend server is running.',
        );
    });

    it('converts request aborts to timeout errors', async () => {
        vi.useFakeTimers();
        vi.mocked(fetch).mockImplementation((_url, init) => {
            return new Promise<Response>((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                    reject(new DOMException('Aborted', 'AbortError'));
                });
            });
        });

        const pendingQuery = new HttpApiClient('https://api.example.com').query(request);
        const assertion = expect(pendingQuery).rejects.toThrow('Request timeout. Please try again.');
        await vi.advanceTimersByTimeAsync(constants.API_QUERY_TIMEOUT_MS);

        await assertion;
        vi.useRealTimers();
    });
});

describe('DemoApiClient', () => {
    it('returns a configured demo answer with metadata', async () => {
        const client = new DemoApiClient({
            stubModel: 'demo-test-model',
            stubQA: [
                {
                    question: request.question,
                    result,
                },
            ],
        });

        const response = await client.query(request);

        expect(response.result).toEqual(result);
        expect(response.metadata).toMatchObject({
            model: 'demo-test-model',
            execTimeMs: 0,
            usage: {
                inputTokens: 0,
                outputTokens: 0,
            },
        });
        expect(response.metadata.usage.totalTokens).toBeGreaterThanOrEqual(100);
    });

    it('honors the configured artificial delay', async () => {
        vi.useFakeTimers();
        const client = new DemoApiClient({
            delayMs: 250,
            stubQA: [
                {
                    question: request.question,
                    result,
                },
            ],
        });

        const pendingQuery = client.query(request);
        await vi.advanceTimersByTimeAsync(249);
        let settled = false;
        void pendingQuery.finally(() => {
            settled = true;
        });

        expect(settled).toBe(false);

        await vi.advanceTimersByTimeAsync(1);

        await expect(pendingQuery).resolves.toMatchObject({
            result,
            metadata: {
                execTimeMs: 250,
            },
        });
    });

    it('throws when no demo answer is configured for the question', async () => {
        const client = new DemoApiClient();

        await expect(client.query(request)).rejects.toThrow(
            'Could not mapped a result for question: How do I open settings?',
        );
    });
});
