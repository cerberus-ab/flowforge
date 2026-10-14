import type { PageTrailDto } from '@flowforge/contract';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeApiClient, createQueryResponseFixture } from '../../../../test/unit/fakes/FakeApiClient';
import { FakeStorage } from '../../../../test/unit/fakes/FakeStorage';
import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import { QuerySessionStorage } from '@/core/services/QuerySessionStorage';
import { PageClient } from '@/page/client/PageClient';
import { PopupClient } from '@/popup/client/PopupClient';
import {
    MessageRouter,
    type AskQuestionMessage,
    type ClearQueryMessage,
    type GetPrevQuestionsMessage,
    type RestoreQueryMessage,
} from '@/messaging';
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
            new PopupClient(transport),
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
        expect(response).toMatchObject({ queryId: expect.any(String) });
        const queryId = response.queryId;
        await vi.waitFor(async () => {
            await expect(sessionStorage.get(querySessionKey(7))).resolves.toMatchObject({ state: 'completed' });
        });
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
            queryId,
            url: 'https://app.flowforge.test/settings',
            state: 'completed',
            data: {
                question: 'How do I save?',
                result: queryResponse.result,
                metadata: queryResponse.metadata,
                trailSnapshot: pageTrailDto.metadata.snapshot,
            },
        });
        expect(transport.getSentToPopup()).toEqual([
            { message: { type: 'QUERY_FINISHED', data: { queryId } }, context: { pageId: 7 } },
        ]);
    });

    it('persists an API failure as a completed query and notifies the popup', async () => {
        // Given
        const apiClient = new FakeApiClient(new Error('API unavailable'));
        const sessionStorage = new FakeStorage();
        const pageTrailDto = createPageTrailDtoFixture();
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings', pageTrailDto });
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            new PopupClient(transport),
            apiClient,
            new QuerySessionStorage(sessionStorage),
            new HistoryStorage(new FakeStorage(), 5),
        );
        const message: AskQuestionMessage = {
            type: 'ASK_QUESTION',
            data: { question: 'How do I save?' },
        };

        // When / Then
        const { queryId } = await handler.handleAskQuestion(message, { pageId: 7 });
        await vi.waitFor(async () => {
            await expect(sessionStorage.get(querySessionKey(7))).resolves.toMatchObject({ state: 'completed' });
        });
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toEqual({
            queryId,
            url: 'https://app.flowforge.test/settings',
            state: 'completed',
            data: { question: 'How do I save?', error: 'API unavailable' },
        });
        expect(transport.getSentToPopup()).toEqual([
            { message: { type: 'QUERY_FINISHED', data: { queryId } }, context: { pageId: 7 } },
        ]);
    });

    it('notifies the popup when saving question history fails', async () => {
        // Given
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const sessionStorage = new FakeStorage();
        const historyStorage = new HistoryStorage(new FakeStorage(), 5);
        vi.spyOn(historyStorage, 'saveQuestion').mockRejectedValue(new Error('History unavailable'));
        const transport = createTransport({
            pageUrl: 'https://app.flowforge.test/settings',
            pageTrailDto: createPageTrailDtoFixture(),
        });
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            new PopupClient(transport),
            new FakeApiClient(),
            new QuerySessionStorage(sessionStorage),
            historyStorage,
        );

        // When
        const { queryId } = await handler.handleAskQuestion(
            { type: 'ASK_QUESTION', data: { question: 'How do I save?' } },
            { pageId: 7 },
        );

        // Then
        await vi.waitFor(() => {
            expect(transport.getSentToPopup()).toEqual([
                { message: { type: 'QUERY_FINISHED', data: { queryId } }, context: { pageId: 7 } },
            ]);
        });
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toMatchObject({ state: 'completed' });
    });

    it('notifies the popup when an older query is replaced', async () => {
        // Given
        let resolveFirstQuery!: (response: ReturnType<typeof createQueryResponseFixture>) => void;
        const apiClient = new FakeApiClient();
        vi.spyOn(apiClient, 'query').mockImplementation((request) =>
            request.question === 'First question'
                ? new Promise((resolve) => {
                      resolveFirstQuery = resolve;
                  })
                : Promise.resolve(createQueryResponseFixture()),
        );
        const sessionStorage = new FakeStorage();
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            new PopupClient(transport),
            apiClient,
            new QuerySessionStorage(sessionStorage),
            new HistoryStorage(new FakeStorage(), 5),
        );

        // When
        const first = await handler.handleAskQuestion(
            { type: 'ASK_QUESTION', data: { question: 'First question' } },
            { pageId: 7 },
        );
        await vi.waitFor(() => expect(apiClient.query).toHaveBeenCalledTimes(1));
        const second = await handler.handleAskQuestion(
            { type: 'ASK_QUESTION', data: { question: 'Second question' } },
            { pageId: 7 },
        );
        await vi.waitFor(async () => {
            await expect(sessionStorage.get(querySessionKey(7))).resolves.toMatchObject({ queryId: second.queryId });
        });
        resolveFirstQuery(createQueryResponseFixture());

        // Then
        await vi.waitFor(() => {
            expect(transport.getSentToPopup()).toContainEqual({
                message: { type: 'QUERY_FINISHED', data: { queryId: first.queryId } },
                context: { pageId: 7 },
            });
        });
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toMatchObject({ queryId: second.queryId });
    });

    it('notifies the popup when saving the completed query fails', async () => {
        // Given
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const sessionStorage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(sessionStorage);
        vi.spyOn(querySessionStorage, 'updateCompleted').mockRejectedValue(new Error('Session storage unavailable'));
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            new PopupClient(transport),
            new FakeApiClient(),
            querySessionStorage,
            new HistoryStorage(new FakeStorage(), 5),
        );

        // When
        const { queryId } = await handler.handleAskQuestion(
            { type: 'ASK_QUESTION', data: { question: 'How do I save?' } },
            { pageId: 7 },
        );

        // Then
        await vi.waitFor(() => {
            expect(transport.getSentToPopup()).toEqual([
                { message: { type: 'QUERY_FINISHED', data: { queryId } }, context: { pageId: 7 } },
            ]);
        });
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toMatchObject({ state: 'pending' });
    });

    it('returns previous questions for the sender hostname', async () => {
        // Given
        const historyStorage = new HistoryStorage(new FakeStorage(), 5);
        await historyStorage.saveQuestion('app.flowforge.test', 'How do I save?');
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            new PopupClient(transport),
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
            status: 'empty',
        });
        expect(transport.getSentToPage()).toEqual([]);
    });

    it('removes a saved query session when the page URL changed', async () => {
        const sessionStorage = new FakeStorage();
        await saveCompletedQuery(sessionStorage, '1-old');
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/other' });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            status: 'empty',
        });
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toBeNull();
        expect(transport.getSentToPage()).toEqual([]);
    });

    it('discards a pending query session if its task is no longer active', async () => {
        const sessionStorage = new FakeStorage();
        const pendingData = { question: 'How do I save?' };
        await sessionStorage.set(querySessionKey(7), {
            queryId: 'query-7',
            url: 'https://app.flowforge.test/settings',
            state: 'pending',
            data: pendingData,
        });
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            status: 'empty',
        });
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toBeNull();
        expect(transport.getSentToPage()).toEqual([]);
    });

    it('restores a pending query while its task is still active', async () => {
        const sessionStorage = new FakeStorage();
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        let releaseQuery!: (response: ReturnType<typeof createQueryResponseFixture>) => void;
        let queryStarted!: () => void;
        const started = new Promise<void>((resolve) => {
            queryStarted = resolve;
        });
        const apiClient = {
            query: vi.fn(() => {
                queryStarted();
                return new Promise<ReturnType<typeof createQueryResponseFixture>>((resolve) => {
                    releaseQuery = resolve;
                });
            }),
        };
        const handler = new QueryMessageHandler(
            new PageClient(transport),
            new PopupClient(transport),
            apiClient,
            new QuerySessionStorage(sessionStorage),
            new HistoryStorage(new FakeStorage(), 5),
        );

        const { queryId } = await handler.handleAskQuestion(
            { type: 'ASK_QUESTION', data: { question: 'How do I save?' } },
            { pageId: 7 },
        );
        await started;

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            status: 'pending',
            queryId,
            data: { question: 'How do I save?' },
        });

        releaseQuery(createQueryResponseFixture());
        await vi.waitFor(async () => {
            await expect(sessionStorage.get(querySessionKey(7))).resolves.toMatchObject({ state: 'completed' });
        });
    });

    it('restores a completed query when all result elements are still present', async () => {
        const sessionStorage = new FakeStorage();
        const queryResponse = createQueryResponseFixture({
            result: {
                answer: 'Click Save, then Confirm.',
                elements: [
                    { text: 'Save', dataId: 'ff00000001', action: 'click' },
                    { text: 'Confirm', dataId: 'ff00000002', action: 'click' },
                ],
                mode: 'steps',
                topic: 'Saving',
            },
        });
        await saveCompletedQuery(sessionStorage, '2-saved', queryResponse);
        const transport = createTransport({
            pageUrl: 'https://app.flowforge.test/settings',
            containsElements: true,
        });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            status: 'completed',
            queryId: 'query-7',
            data: {
                question: 'How do I save?',
                result: queryResponse.result,
                metadata: queryResponse.metadata,
                trailSnapshot: {
                    ...createPageTrailDtoFixture().metadata.snapshot,
                    dataIdSignature: '2-saved',
                },
            },
        });
        expect(transport.getSentToPage()).toEqual([
            {
                pageId: 7,
                message: { type: 'CONTAINS_ELEMENTS', data: { dataIds: ['ff00000001', 'ff00000002'] } },
            },
        ]);
    });

    it('restores the completed answer as stale when a result element is missing', async () => {
        const sessionStorage = new FakeStorage();
        const queryResponse = createQueryResponseFixture({
            result: {
                answer: 'Click Save.',
                elements: [{ text: 'Save', dataId: 'ff00000001', action: 'click' }],
                mode: 'direct',
                topic: null,
            },
        });
        await saveCompletedQuery(sessionStorage, '1-saved', queryResponse);
        const transport = createTransport({
            pageUrl: 'https://app.flowforge.test/settings',
            containsElements: false,
        });
        const handler = createQueryHandler(transport, sessionStorage);

        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({
            status: 'stale',
            queryId: 'query-7',
            data: {
                question: 'How do I save?',
                result: queryResponse.result,
                metadata: queryResponse.metadata,
                trailSnapshot: expect.objectContaining({ dataIdSignature: '1-saved' }),
            },
        });
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CONTAINS_ELEMENTS', data: { dataIds: ['ff00000001'] } } },
        ]);
        await expect(sessionStorage.get(querySessionKey(7))).resolves.toMatchObject({ state: 'completed' });
    });

    it('restores a completed answer without result elements without querying the page', async () => {
        const sessionStorage = new FakeStorage();
        await saveCompletedQuery(sessionStorage, undefined);
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = createQueryHandler(transport, sessionStorage);

        const response = await handler.handleRestoreQuery(restoreMessage, { pageId: 7 });

        expect(response).toMatchObject({ status: 'completed' });
        expect(transport.getSentToPage()).toEqual([]);
    });

    it('clears only the matching completed query for the sender page', async () => {
        // Given
        const sessionStorage = new FakeStorage();
        await saveCompletedQuery(sessionStorage, '1-saved');
        const handler = createQueryHandler(createTransport(), sessionStorage);
        const router = new MessageRouter(handler.routes());
        const clearMessage: ClearQueryMessage = { type: 'CLEAR_QUERY', data: { queryId: 'query-7' } };

        // When / Then
        await expect(handler.handleClearQuery(clearMessage, { pageId: 8 })).resolves.toBe(false);
        await expect(
            handler.handleClearQuery({ type: 'CLEAR_QUERY', data: { queryId: 'other-query' } }, { pageId: 7 }),
        ).resolves.toBe(false);
        await expect(sessionStorage.get(querySessionKey(7))).resolves.not.toBeNull();
        await expect(router.handle(clearMessage, { pageId: 7 })).resolves.toEqual({ success: true, data: true });
        await expect(handler.handleRestoreQuery(restoreMessage, { pageId: 7 })).resolves.toEqual({ status: 'empty' });
    });
});

function createTransport({
    pageUrl = 'http://localhost/',
    pageTrailDto = createPageTrailDtoFixture(),
    containsElements,
}: {
    pageUrl?: string;
    pageTrailDto?: PageTrailDto;
    containsElements?: boolean;
} = {}) {
    const transport = new FakeTransportService({ activePageId: 7, pageUrl });
    transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: pageTrailDto });
    if (containsElements !== undefined) {
        transport.setPageResponse('CONTAINS_ELEMENTS', { success: true, data: containsElements });
    }
    return transport;
}

const restoreMessage: RestoreQueryMessage = { type: 'RESTORE_QUERY' };

function createQueryHandler(transport: FakeTransportService, sessionStorage: FakeStorage): QueryMessageHandler {
    return new QueryMessageHandler(
        new PageClient(transport),
        new PopupClient(transport),
        new FakeApiClient(),
        new QuerySessionStorage(sessionStorage),
        new HistoryStorage(new FakeStorage(), 5),
    );
}

async function saveCompletedQuery(
    sessionStorage: FakeStorage,
    dataIdSignature: string | undefined,
    queryResponse = createQueryResponseFixture(),
): Promise<void> {
    const trailSnapshot = createPageTrailDtoFixture().metadata.snapshot;
    await sessionStorage.set(querySessionKey(7), {
        queryId: 'query-7',
        url: 'https://app.flowforge.test/settings',
        state: 'completed',
        data: {
            question: 'How do I save?',
            result: queryResponse.result,
            metadata: queryResponse.metadata,
            trailSnapshot: { ...trailSnapshot, dataIdSignature },
        },
    });
}

const querySessionKey = (pageId: number) => `flowforge_query_session::${pageId}`;
