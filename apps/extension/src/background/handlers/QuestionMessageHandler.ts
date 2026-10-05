import type { QueryRequest } from '@flowforge/contract';

import type { TransportService } from '@/adapters/interface';
import type { ApiClient } from '@/core/services/ApiClient';
import type { HistoryStorage } from '@/core/services/HistoryStorage';
import {
    type AskQuestionMessage,
    type AskQuestionMessageResponse,
    type ClearPageMessage,
    type CollectPageTrailMessage,
    type CollectPageTrailMessageResponse,
    type GetPrevQuestionsMessage,
    type GetPrevQuestionsMessageResponse,
    isAskQuestionMessage,
    isGetPrevQuestionsMessage,
    type Message,
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

    /** Routes supported question messages to their operations. */
    handle(message: Message): Promise<AskQuestionMessageResponse | GetPrevQuestionsMessageResponse> | undefined {
        if (isAskQuestionMessage(message)) return this.handleAskQuestion(message);
        if (isGetPrevQuestionsMessage(message)) return this.handleGetPrevQuestions(message);
        return undefined;
    }

    /** Collects page context, queries the backend, and starts onboarding. */
    private async handleAskQuestion(message: AskQuestionMessage): Promise<AskQuestionMessageResponse> {
        await this.transport.sendToPage<ClearPageMessage>(message.senderId, {
            type: 'CLEAR_PAGE',
        });
        const pageTrailResponse = await this.transport.sendToPage<
            CollectPageTrailMessage,
            CollectPageTrailMessageResponse
        >(message.senderId, { type: 'COLLECT_PAGE_TRAIL' });
        if (!pageTrailResponse.success) {
            throw new Error('Failed to collect page trail: ' + pageTrailResponse.error);
        }
        console.log('[FlowForge] Background collected page trail:', pageTrailResponse);

        const pageTrailDto = pageTrailResponse.data;
        const domain = await this.transport.getSenderHostname(message.senderId);
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
            await this.transport.sendToPage<StartOnboardingMessage>(message.senderId, startOnboardingMsg);
        }
        await this.historyStorage.saveQuestion(domain, message.data.question);
        return { success: true, data: responseData };
    }

    /** Returns the saved question history for the sender domain. */
    private async handleGetPrevQuestions(message: GetPrevQuestionsMessage): Promise<GetPrevQuestionsMessageResponse> {
        const domain = await this.transport.getSenderHostname(message.senderId);
        const questions = await this.historyStorage.getPreviousQuestions(domain);
        return { success: true, data: { questions } };
    }
}
