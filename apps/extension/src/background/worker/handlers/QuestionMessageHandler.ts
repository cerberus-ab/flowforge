import type { QueryRequest, QueryResponse } from '@flowforge/contract';

import type { ApiClient } from '@/core/services/ApiClient';
import type { HistoryStorage } from '@/core/services/HistoryStorage';
import type { PageQuestionClient } from '@/page/client/contract';
import {
    type AskQuestionMessage,
    type GetPrevQuestionsMessage,
    type PageScopedMessage,
    type PreviousQuestions,
    type StartOnboardingMessageData,
} from '@/messaging';

/**
 * Handles the question workflow and its per-domain history.
 * It collects page context, submits questions to the API, starts onboarding from
 * the response, and reads or updates previously asked questions.
 */
export class QuestionMessageHandler {
    private readonly pageClient: PageQuestionClient;
    private readonly apiClient: ApiClient;
    private readonly historyStorage: HistoryStorage;

    constructor(pageClient: PageQuestionClient, apiClient: ApiClient, historyStorage: HistoryStorage) {
        this.pageClient = pageClient;
        this.apiClient = apiClient;
        this.historyStorage = historyStorage;
    }

    async handleAskQuestion(message: PageScopedMessage<AskQuestionMessage>): Promise<QueryResponse> {
        await this.pageClient.clearPage(message.pageId);
        const pageTrailDto = await this.pageClient.collectPageTrail(message.pageId);
        console.log('[FlowForge] Background collected page trail:', pageTrailDto);

        const domain = await this.pageClient.getHostname(message.pageId);
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
            const onboarding: StartOnboardingMessageData = {
                title: result.topic ?? message.data.question,
                description: result.answer,
                elements: result.elements,
                mode: result.mode,
            };
            await this.pageClient.startOnboarding(message.pageId, onboarding);
        }
        await this.historyStorage.saveQuestion(domain, message.data.question);
        return responseData;
    }

    async handleGetPrevQuestions(message: PageScopedMessage<GetPrevQuestionsMessage>): Promise<PreviousQuestions> {
        const domain = await this.pageClient.getHostname(message.pageId);
        const questions = await this.historyStorage.getPreviousQuestions(domain);
        return { questions };
    }
}
