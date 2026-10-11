import type { QueryRequest, QueryResponse } from '@flowforge/contract';

import type { ApiClient } from '@/core/services/ApiClient';
import type { HistoryStorage } from '@/core/services/HistoryStorage';
import type { PageQuestionClient } from '@/page/client/contract';
import {
    type AskQuestionMessage,
    type GetPrevQuestionsMessage,
    type MessageContext,
    type PreviousQuestionsResponse,
    MessageRouter,
    isAskQuestionMessage,
    isGetPrevQuestionsMessage,
    requirePageId,
    type RestoreQueryMessage,
    isRestoreQueryMessage,
    type RestoreQueryResponse,
} from '@/messaging';
import type { BackgroundMessageHandler } from './BackgroundMessageHandler';
import type { QuerySessionStorage } from '@/core/services/QuerySessionStorage';

/**
 * Handles question requests and per-domain question history.
 * Collects page context and submits new questions to the API.
 * Also retrieves the previous questions associated with the page domain.
 */
export class QueryMessageHandler implements BackgroundMessageHandler {
    private readonly pageClient: PageQuestionClient;
    private readonly apiClient: ApiClient;
    private readonly querySessionStorage: QuerySessionStorage;
    private readonly historyStorage: HistoryStorage;

    constructor(
        pageClient: PageQuestionClient,
        apiClient: ApiClient,
        querySessionStorage: QuerySessionStorage,
        historyStorage: HistoryStorage,
    ) {
        this.pageClient = pageClient;
        this.apiClient = apiClient;
        this.querySessionStorage = querySessionStorage;
        this.historyStorage = historyStorage;
    }

    routes() {
        return [
            MessageRouter.route(isAskQuestionMessage, (message, context) => this.handleAskQuestion(message, context)),
            MessageRouter.route(isRestoreQueryMessage, (message, context) => this.handleRestoreQuery(message, context)),
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
        await this.querySessionStorage.savePending(pageId, url, { question });

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
        await this.querySessionStorage.saveCompleted(pageId, url, {
            question,
            result: responseData.result,
            metadata: responseData.metadata,
            trailSnapshot: requestData.pageTrailDto.metadata.snapshot,
        });
        return responseData;
    }

    /** Trys to restore query from session, might be called on initialization. */
    async handleRestoreQuery(_message: RestoreQueryMessage, context: MessageContext): Promise<RestoreQueryResponse> {
        const pageId = requirePageId(context);

        const record = await this.querySessionStorage.getRecord(pageId);

        // nothing is saved
        if (record == null) {
            return { restored: false, reason: 'empty' };
        }
        // validate by url
        const url = await this.pageClient.getUrl(pageId);
        if (record.url !== url) {
            await this.querySessionStorage.removeRecord(pageId);
            return { restored: false, reason: 'mismatch:url' };
        }
        // if pending return
        if (record.state === 'pending') {
            return { restored: true, state: record.state, data: record.data, reason: 'ok' };
        }
        const recFingerprint = record.data.trailSnapshot.trailFingerprint;
        if (recFingerprint.dataIdSignature !== undefined) {
            // validate by fingerprint
            const lifeFingerprint = await this.pageClient.collectTrailFingerprint(pageId);
            if (recFingerprint.dataIdSignature !== lifeFingerprint.dataIdSignature) {
                const pendingData = { question: record.data.question };
                await this.querySessionStorage.savePending(pageId, url, pendingData);
                return { restored: true, state: 'pending', data: pendingData, reason: 'mismatch:fingerprint' };
            }
        }
        return {
            restored: true,
            state: record.state,
            data: {
                question: record.data.question,
                result: record.data.result,
                metadata: record.data.metadata,
            },
            reason: 'ok',
        };
    }

    /** Returns the saved question history for the sender page's domain. */
    async handleGetPrevQuestions(
        _message: GetPrevQuestionsMessage,
        context: MessageContext,
    ): Promise<PreviousQuestionsResponse> {
        const pageId = requirePageId(context);

        const url = await this.pageClient.getUrl(pageId);
        const domain = new URL(url).hostname;

        const questions = await this.historyStorage.getPreviousQuestions(domain);
        return { questions };
    }
}
