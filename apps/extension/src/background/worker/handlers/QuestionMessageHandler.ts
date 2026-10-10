import type { QueryRequest, QueryResponse } from '@flowforge/contract';

import type { ApiClient } from '@/core/services/ApiClient';
import type { HistoryStorage } from '@/core/services/HistoryStorage';
import type { PageQuestionClient } from '@/page/client/contract';
import {
    type AskQuestionMessage,
    type GetPrevQuestionsMessage,
    type MessageContext,
    type PreviousQuestions,
    requirePageId,
} from '@/messaging';

/**
 * Handles the question workflow and its per-domain history.
 * It collects page context, submits questions to the API, and reads or updates
 * previously asked questions.
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

    async handleAskQuestion(message: AskQuestionMessage, context: MessageContext): Promise<QueryResponse> {
        const pageId = requirePageId(context);
        await this.pageClient.clearPage(pageId);
        const pageTrailDto = await this.pageClient.collectPageTrail(pageId);
        console.log('[FlowForge] Background collected page trail:', pageTrailDto);

        const domain = await this.pageClient.getHostname(pageId);
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

        await this.historyStorage.saveQuestion(domain, message.data.question);
        return responseData;
    }

    async handleGetPrevQuestions(
        _message: GetPrevQuestionsMessage,
        context: MessageContext,
    ): Promise<PreviousQuestions> {
        const domain = await this.pageClient.getHostname(requirePageId(context));
        const questions = await this.historyStorage.getPreviousQuestions(domain);
        return { questions };
    }
}
