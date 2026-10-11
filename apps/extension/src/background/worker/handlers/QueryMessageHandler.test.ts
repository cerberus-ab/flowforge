import type { PageTrailDto } from '@flowforge/contract';
import type { TrailFingerprint } from '@flowforge/page-trail';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeApiClient, createQueryResponseFixture } from '../../../../test/unit/fakes/FakeApiClient';
import { FakeStorage } from '../../../../test/unit/fakes/FakeStorage';
import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import { QuerySessionStorage } from '@/core/services/QuerySessionStorage';
import { PageClient } from '@/page/client/PageClient';
import type { AskQuestionMessage, GetPrevQuestionsMessage, RestoreQueryMessage } from '@/messaging';
import { QueryMessageHandler } from './QueryMessageHandler';

describe('QueryMessageHandler', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    it('answers a question through page collection, API query, and history without opening onboarding', async () => {
        // Given
        const element = {
            text: 'Save',
            dataId: 'save-button',
            cssSelector: '#save',
            action: 'click',
        } as const;
        const queryResponse = createQueryResponseFixture({
            result: {
                answer: 'Click Save.',
                elements: [element],
                mode: 'steps',
                topic: 'Saving',
            },
        });
        const pageTrailDto = createPageTrailDtoFixture({
            basics: {
                url: 'https://app.flowforge.test/settings',
                title: 'Settings page',
                description: 'Application settings',
                language: 'en',
                viewport: { width: 1440, height: 900, scrollY: 120, scrollHeight: 1800 },
            },
        });
        const apiClient = new FakeApiClient(queryResponse);
        const sessionStorage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(sessionStorage);
        const historyStorage = new HistoryStorage(new FakeStorage(), 5);
        await historyStorage.saveQuestion('app.flowforge.test', 'Previous question');
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings', pageTrailDto });
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            apiClient,
            querySessionStorage,
            historyStorage,
        );
        const message: AskQuestionMessage = {
            type: 'ASK_QUESTION',
            data: { question: 'How do I save?' },
        };

        // When
        const response = await handler.handleAskQuestion(message, { pageId: 7 });

        // Then
        expect(response).toEqual(queryResponse);
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CLEAR_PAGE' } },
            { pageId: 7, message: { type: 'COLLECT_PAGE_TRAIL' } },
        ]);
        expect(apiClient.requests).toEqual([
            {
                question: 'How do I save?',
                pageTrailDto,
                domain: 'app.flowforge.test',
                userContext: { previousQuestions: ['Previous question'] },
            },
        ]);
        await expect(historyStorage.getPreviousQuestions('app.flowforge.test')).resolves.toEqual([
            'How do I save?',
            'Previous question',
        ]);
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toEqual({
            url: 'https://app.flowforge.test/settings',
            state: 'completed',
            data: {
                question: 'How do I save?',
                result: queryResponse.result,
                metadata: queryResponse.metadata,
                trailSnapshot: pageTrailDto.metadata.snapshot,
            },
        });
    });

    it('keeps the submitted question in the page session when the API request fails', async () => {
        // Given
        const apiClient = new FakeApiClient(new Error('API unavailable'));
        const sessionStorage = new FakeStorage();
        const pageTrailDto = createPageTrailDtoFixture();
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings', pageTrailDto });
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            apiClient,
            new QuerySessionStorage(sessionStorage),
            new HistoryStorage(new FakeStorage(), 5),
        );
        const message: AskQuestionMessage = {
            type: 'ASK_QUESTION',
            data: { question: 'How do I save?' },
        };

        // When / Then
        await expect(handler.handleAskQuestion(message, { pageId: 7 })).rejects.toThrow('API unavailable');
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toEqual({
            url: 'https://app.flowforge.test/settings',
            state: 'pending',
            data: { question: 'How do I save?' },
        });
    });

    it('returns previous questions for the sender hostname', async () => {
        // Given
        const historyStorage = new HistoryStorage(new FakeStorage(), 5);
        await historyStorage.saveQuestion('app.flowforge.test', 'How do I save?');
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            new FakeApiClient(),
            new QuerySessionStorage(new FakeStorage()),
            historyStorage,
        );
        const message: GetPrevQuestionsMessage = { type: 'GET_PREV_QUESTIONS' };

        // When
        const response = await handler.handleGetPrevQuestions(message, { pageId: 7 });

        // Then
        expect(response).toEqual({ questions: ['How do I save?'] });
    });

    it('returns empty when there is no saved query session', async () => {
        const sessionStorage = new FakeStorage();
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            restored: false,
            reason: 'empty',
        });
        expect(transport.getSentToPage()).toEqual([]);
    });

    it('removes a saved query session when the page URL changed', async () => {
        const sessionStorage = new FakeStorage();
        await saveCompletedQuery(sessionStorage, fingerprint('1-old'));
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/other' });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            restored: false,
            reason: 'mismatch:url',
        });
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toBeNull();
        expect(transport.getSentToPage()).toEqual([]);
    });

    it('restores pending query sessions without checking the page fingerprint', async () => {
        const sessionStorage = new FakeStorage();
        const pendingData = { question: 'How do I save?' };
        await sessionStorage.set(querySessionKey(7), {
            url: 'https://app.flowforge.test/settings',
            state: 'pending',
            data: pendingData,
        });
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            restored: true,
            state: 'pending',
            data: pendingData,
            reason: 'ok',
        });
        expect(transport.getSentToPage()).toEqual([]);
    });

    it('restores a completed query when the page fingerprint still matches', async () => {
        const sessionStorage = new FakeStorage();
        const queryResponse = createQueryResponseFixture();
        const trailFingerprint = fingerprint('1-current');
        await saveCompletedQuery(sessionStorage, trailFingerprint, queryResponse);
        const transport = createTransport({
            pageUrl: 'https://app.flowforge.test/settings',
            trailFingerprint,
        });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            restored: true,
            state: 'completed',
            data: {
                question: 'How do I save?',
                result: queryResponse.result,
                metadata: queryResponse.metadata,
            },
            reason: 'ok',
        });
        expect(transport.getSentToPage()).toEqual([{ pageId: 7, message: { type: 'COLLECT_TRAIL_FINGERPRINT' } }]);
    });

    it('resets a completed query to pending when the page fingerprint changed', async () => {
        const sessionStorage = new FakeStorage();
        await saveCompletedQuery(sessionStorage, fingerprint('1-saved'));
        const transport = createTransport({
            pageUrl: 'https://app.flowforge.test/settings',
            trailFingerprint: fingerprint('1-current'),
        });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            restored: true,
            state: 'pending',
            data: { question: 'How do I save?' },
            reason: 'mismatch:fingerprint',
        });
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toEqual({
            url: 'https://app.flowforge.test/settings',
            state: 'pending',
            data: { question: 'How do I save?' },
        });
    });

    it('restores a completed context-only query without checking a fingerprint', async () => {
        const sessionStorage = new FakeStorage();
        await saveCompletedQuery(sessionStorage, fingerprint(undefined));
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = createQueryHandler(transport, sessionStorage);

        const response = await handler.handleRestoreQuery(restoreMessage, { pageId: 7 });

        expect(response).toMatchObject({ restored: true, state: 'completed', reason: 'ok' });
        expect(transport.getSentToPage()).toEqual([]);
    });
});

function createTransport({
    pageUrl = 'http://localhost/',
    pageTrailDto = createPageTrailDtoFixture(),
    trailFingerprint,
}: {
    pageUrl?: string;
    pageTrailDto?: PageTrailDto;
    trailFingerprint?: TrailFingerprint;
} = {}) {
    const transport = new FakeTransportService({ activePageId: 7, pageUrl });
    transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: pageTrailDto });
    if (trailFingerprint !== undefined) {
        transport.setPageResponse('COLLECT_TRAIL_FINGERPRINT', { success: true, data: trailFingerprint });
    }
    return transport;
}

const restoreMessage: RestoreQueryMessage = { type: 'RESTORE_QUERY' };

function createQueryHandler(transport: FakeTransportService, sessionStorage: FakeStorage): QueryMessageHandler {
    return new QueryMessageHandler(
        new PageClient(transport),
        new FakeApiClient(),
        new QuerySessionStorage(sessionStorage),
        new HistoryStorage(new FakeStorage(), 5),
    );
}

async function saveCompletedQuery(
    sessionStorage: FakeStorage,
    trailFingerprint: TrailFingerprint,
    queryResponse = createQueryResponseFixture(),
): Promise<void> {
    const trailSnapshot = createPageTrailDtoFixture().metadata.snapshot;
    await sessionStorage.set(querySessionKey(7), {
        url: 'https://app.flowforge.test/settings',
        state: 'completed',
        data: {
            question: 'How do I save?',
            result: queryResponse.result,
            metadata: queryResponse.metadata,
            trailSnapshot: { ...trailSnapshot, trailFingerprint },
        },
    });
}

const fingerprint = (dataIdSignature: string | undefined): TrailFingerprint => ({ dataIdSignature });

const querySessionKey = (pageId: number) => `flowforge_query_session::${pageId}`;
