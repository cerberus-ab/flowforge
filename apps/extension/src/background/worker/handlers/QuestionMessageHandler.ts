import type { QueryRequest, QueryResponse } from '@flowforge/contract';

import type { ApiClient } from '@/core/services/ApiClient';
import type { HistoryStorage } from '@/core/services/HistoryStorage';
import type { PageQuestionClient } from '@/page/client/contract';
import {
    type AskQuestionMessage,
    type GetPrevQuestionsMessage,
    type MessageContext,
    type PreviousQuestions,
    MessageRouter,
    isAskQuestionMessage,
    isGetPrevQuestionsMessage,
    requirePageId,
} from '@/messaging';
import type { BackgroundMessageHandler } from './BackgroundMessageHandler';
import type { PageSessionStorage } from '@/core/services/PageSessionStorage';

/**
 * Handles question requests and per-domain question history.
 * Collects page context and submits new questions to the API.
 * Also retrieves the previous questions associated with the page domain.
 */
export class QuestionMessageHandler implements BackgroundMessageHandler {
    private readonly pageClient: PageQuestionClient;
    private readonly apiClient: ApiClient;
    private readonly pageSessionStorage: PageSessionStorage;
    private readonly historyStorage: HistoryStorage;

    constructor(
        pageClient: PageQuestionClient,
        apiClient: ApiClient,
        pageSessionStorage: PageSessionStorage,
        historyStorage: HistoryStorage,
    ) {
        this.pageClient = pageClient;
        this.apiClient = apiClient;
        this.pageSessionStorage = pageSessionStorage;
        this.historyStorage = historyStorage;
    }

    routes() {
        return [
            MessageRouter.route(isAskQuestionMessage, (message, context) => this.handleAskQuestion(message, context)),
            MessageRouter.route(isGetPrevQuestionsMessage, (message, context) =>
                this.handleGetPrevQuestions(message, context),
            ),
        ];
    }

    /** Collects page context, queries the API, and saves the submitted question. */
    async handleAskQuestion(message: AskQuestionMessage, context: MessageContext): Promise<QueryResponse> {
        const pageId = requirePageId(context);

        // save question in session
        const question = message.data.question;
        const url = await this.pageClient.getUrl(pageId);
        await this.pageSessionStorage.savePending(pageId, url, { question });

        // collect page trail
        await this.pageClient.clearPage(pageId);
        const pageTrailDto = await this.pageClient.collectPageTrail(pageId);
        console.log('[FlowForge] Background collected page trail:', pageTrailDto);

        // prepare request
        const domain = new URL(url).hostname;
        const previousQuestions = await this.historyStorage.getPreviousQuestions(domain);
        const requestData: QueryRequest = {
            question,
            pageTrailDto,
            domain,
            userContext: {
                previousQuestions,
            },
        };
        // query request
        console.log('[FlowForge] Background sending request to server:', requestData);
        const responseData = await this.apiClient.query(requestData);
        console.log('[FlowForge] Background received response from server:', responseData);

        // save question in history and result in session
        await this.historyStorage.saveQuestion(domain, question);
        await this.pageSessionStorage.saveCompleted(pageId, url, {
            question,
            result: responseData.result,
            metadata: responseData.metadata,
            trailSnapshot: requestData.pageTrailDto.metadata.snapshot,
        });
        return responseData;
    }

    /** Returns the saved question history for the sender page's domain. */
    async handleGetPrevQuestions(
        _message: GetPrevQuestionsMessage,
        context: MessageContext,
    ): Promise<PreviousQuestions> {
        const pageId = requirePageId(context);

        const url = await this.pageClient.getUrl(pageId);
        const domain = new URL(url).hostname;

        const questions = await this.historyStorage.getPreviousQuestions(domain);
        return { questions };
    }
}
