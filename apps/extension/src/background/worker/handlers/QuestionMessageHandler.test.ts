import type { PageTrailDto } from '@flowforge/contract';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeApiClient, createQueryResponseFixture } from '../../../../test/unit/fakes/FakeApiClient';
import { FakeLocalStorage } from '../../../../test/unit/fakes/FakeLocalStorage';
import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import { PageClient } from '@/page/client/PageClient';
import type { AskQuestionMessage, GetPrevQuestionsMessage } from '@/messaging';
import { QuestionMessageHandler } from './QuestionMessageHandler';

describe('QuestionMessageHandler', () => {
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
        const historyStorage = new HistoryStorage(new FakeLocalStorage(), 5);
        await historyStorage.saveQuestion('app.flowforge.test', 'Previous question');
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings', pageTrailDto });
        const handler = new QuestionMessageHandler(new PageClient(transport), apiClient, historyStorage);
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
    });

    it('returns previous questions for the sender hostname', async () => {
        // Given
        const historyStorage = new HistoryStorage(new FakeLocalStorage(), 5);
        await historyStorage.saveQuestion('app.flowforge.test', 'How do I save?');
        const transport = createTransport({ pageUrl: 'https://app.flowforge.test/settings' });
        const handler = new QuestionMessageHandler(new PageClient(transport), new FakeApiClient(), historyStorage);
        const message: GetPrevQuestionsMessage = { type: 'GET_PREV_QUESTIONS' };

        // When
        const response = await handler.handleGetPrevQuestions(message, { pageId: 7 });

        // Then
        expect(response).toEqual({ questions: ['How do I save?'] });
    });
});

function createTransport({
    pageUrl = 'http://localhost/',
    pageTrailDto = createPageTrailDtoFixture(),
}: {
    pageUrl?: string;
    pageTrailDto?: PageTrailDto;
} = {}) {
    const transport = new FakeTransportService({ activePageId: 7, pageUrl });
    transport.setPageResponse('COLLECT_PAGE_TRAIL', { success: true, data: pageTrailDto });
    return transport;
}
