import type { QueryRequest, QueryResponse } from '@flowforge/contract';

import type { Message, TransportService } from '@/adapters';
import type { ApiClient } from '@/core/services/ApiClient';
import type { HistoryStorage } from '@/core/services/HistoryStorage';
import {
    type AskQuestionMessage,
    type CollectPageTrailMessageResponse,
    type GetPrevQuestionsMessage,
    type GetPrevQuestionsMessageResponseData,
    isAskQuestionMessage,
    isGetPrevQuestionsMessage,
    type StartOnboardingMessage,
} from '@/types';

import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles the question workflow and its per-domain history.
 * It collects page context, submits questions to the API, starts onboarding from
 * the response, and reads or updates previously asked questions.
 */
export class QuestionMessageHandler implements BackgroundMessageHandler {
    private readonly transport: TransportService;
    private readonly apiClient: ApiClient;
    private readonly historyStorage: HistoryStorage;

    constructor(transport: TransportService, apiClient: ApiClient, historyStorage: HistoryStorage) {
        this.transport = transport;
        this.apiClient = apiClient;
        this.historyStorage = historyStorage;
    }

    resolve(message: Message): (() => Promise<QueryResponse | GetPrevQuestionsMessageResponseData>) | undefined {
        if (isAskQuestionMessage(message)) return () => this.handleAskQuestion(message);
        if (isGetPrevQuestionsMessage(message)) return () => this.handleGetPrevQuestions(message);
        return undefined;
    }

    private async handleAskQuestion(message: AskQuestionMessage): Promise<QueryResponse> {
        await this.transport.sendToPage(message.pageId, {
            type: 'CLEAR_PAGE',
        });
        const pageTrailResponse = await this.transport.sendToPage<CollectPageTrailMessageResponse>(message.pageId, {
            type: 'COLLECT_PAGE_TRAIL',
        });
        if (!pageTrailResponse.success) {
            throw new Error('Failed to collect page trail: ' + pageTrailResponse.error);
        }
        console.log('[FlowForge] Background collected page trail:', pageTrailResponse);

        const pageTrailDto = pageTrailResponse.data;
        const domain = await this.transport.getPageHostname(message.pageId);
        const requestData: QueryRequest = {
            question: message.data.question,
            pageTrailDto,
            domain,
            userContext: {
                previousQuestions: await this.historyStorage.getPreviousQuestions(domain),
            },
        };
        console.log('[FlowForge] Background sending request to server:', requestData);
        const responseData = await this.apiClient.query(requestData);
        console.log('[FlowForge] Background received response from server:', responseData);
        const result = responseData.result;

        if (result.elements.length > 0) {
            const startOnboardingMsg: StartOnboardingMessage = {
                type: 'START_ONBOARDING',
                data: {
                    title: result.topic ?? message.data.question,
                    description: result.answer,
                    elements: result.elements,
                    mode: result.mode,
                },
            };
            await this.transport.sendToPage(message.pageId, startOnboardingMsg);
        }
        await this.historyStorage.saveQuestion(domain, message.data.question);
        return responseData;
    }

    private async handleGetPrevQuestions(
        message: GetPrevQuestionsMessage,
    ): Promise<GetPrevQuestionsMessageResponseData> {
        const domain = await this.transport.getPageHostname(message.pageId);
        const questions = await this.historyStorage.getPreviousQuestions(domain);
        return { questions };
    }
}
