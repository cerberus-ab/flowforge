import type { QueryRequest } from '@flowforge/contract';

import type { ApiClient } from '@/services/ApiClient';
import type { HistoryStorage } from '@/services/HistoryStorage';
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
    type ClearQueryMessage,
    isClearQueryMessage,
    type RestoreQueryResponse,
    type AskQuestionResponse,
} from '@/messaging';
import type { BackgroundMessageHandler } from './BackgroundMessageHandler';
import type { QuerySessionDataAnswer, QuerySessionStorage } from '@/services/QuerySessionStorage';
import { generateUniqueId } from '@/shared/utils/id';
import type { PopupQueryClient } from '@/popup/client/contract';

/**
 * Coordinates query execution and restoration for a page.
 * Persists query state, gathers page context, and sends the request to the API.
 * Also serves the question history associated with the page's domain.
 */
export class QueryMessageHandler implements BackgroundMessageHandler {
    private readonly activeQueryIds = new Set<string>();
    private readonly pageClient: PageQuestionClient;
    private readonly apiClient: ApiClient;
    private readonly querySessionStorage: QuerySessionStorage;
    private readonly historyStorage: HistoryStorage;
    private readonly popupClient: PopupQueryClient;

    constructor(
        pageClient: PageQuestionClient,
        popupClient: PopupQueryClient,
        apiClient: ApiClient,
        querySessionStorage: QuerySessionStorage,
        historyStorage: HistoryStorage,
    ) {
        this.pageClient = pageClient;
        this.popupClient = popupClient;
        this.apiClient = apiClient;
        this.querySessionStorage = querySessionStorage;
        this.historyStorage = historyStorage;
    }

    /** Creates the message routes owned by this handler. */
    routes() {
        return [
            MessageRouter.route(isAskQuestionMessage, (message, context) => this.handleAskQuestion(message, context)),
            MessageRouter.route(isRestoreQueryMessage, (message, context) => this.handleRestoreQuery(message, context)),
            MessageRouter.route(isClearQueryMessage, (message, context) => this.handleClearQuery(message, context)),
            MessageRouter.route(isGetPrevQuestionsMessage, (message, context) =>
                this.handleGetPrevQuestions(message, context),
            ),
        ];
    }

    /** Persists a pending query, then starts processing without waiting for its result. */
    async handleAskQuestion(message: AskQuestionMessage, context: MessageContext): Promise<AskQuestionResponse> {
        const pageId = requirePageId(context);
        const queryId = generateUniqueId();

        const question = message.data.question;
        const url = await this.pageClient.getUrl(pageId);
        await this.querySessionStorage.savePending(pageId, queryId, url, { question });
        this.activeQueryIds.add(queryId);

        // Return the ID immediately; the popup gets completion through its query-finished message.
        void this.processQuestion(pageId, queryId, url, question)
            .catch((error: unknown) => {
                console.error('[FlowForge] Failed to process query session:', error);
            })
            .finally(() => this.activeQueryIds.delete(queryId));

        return { queryId };
    }

    /** Collects page context, runs the API query, and persists its outcome. */
    private async processQuestion(pageId: number, queryId: string, url: string, question: string): Promise<void> {
        let completedData: QuerySessionDataAnswer | { error: string };
        let domain: string | undefined;

        try {
            await this.pageClient.clearPage(pageId);
            const pageTrailDto = await this.pageClient.collectPageTrail(pageId);
            console.log('[FlowForge] Background collected page trail:', pageTrailDto);

            domain = new URL(url).hostname;
            const previousQuestions = await this.historyStorage.getPreviousQuestions(domain);
            const requestData: QueryRequest = {
                question,
                pageTrailDto,
                domain,
                userContext: { previousQuestions },
            };
            console.log('[FlowForge] Background sending request to server:', requestData);
            const responseData = await this.apiClient.query(requestData);
            console.log('[FlowForge] Background received response from server:', responseData);
            completedData = {
                result: responseData.result,
                metadata: responseData.metadata,
                trailSnapshot: pageTrailDto.metadata.snapshot,
            };
        } catch (error) {
            completedData = { error: error instanceof Error ? error.message : String(error) };
        }

        try {
            const updated = await this.querySessionStorage.updateCompleted(pageId, queryId, completedData);
            // A newer query may have replaced this page's session while this one was running.
            if (!updated) return;

            if (domain !== undefined && !('error' in completedData)) {
                try {
                    await this.historyStorage.saveQuestion(domain, question);
                } catch (error) {
                    // History is secondary; it must not prevent delivery of the query result.
                    console.error('[FlowForge] Failed to save question history:', error);
                }
            }
        } finally {
            // The popup must leave loading even when this query was replaced or storage failed.
            await this.popupClient.notifyQueryFinished(pageId, queryId);
        }
    }

    /** Restores the page's query state, validating its URL and referenced result elements. */
    async handleRestoreQuery(_message: RestoreQueryMessage, context: MessageContext): Promise<RestoreQueryResponse> {
        const pageId = requirePageId(context);

        const record = await this.querySessionStorage.getRecord(pageId);

        if (record == null) return { status: 'empty' };

        const url = await this.pageClient.getUrl(pageId);
        if (record.url !== url) {
            await this.querySessionStorage.removeRecord(pageId);
            return { status: 'empty' };
        }
        if (record.state === 'pending') {
            if (!this.activeQueryIds.has(record.queryId)) {
                await this.querySessionStorage.removeRecord(pageId);
                return { status: 'empty' };
            }
            return { status: 'pending', queryId: record.queryId, data: record.data };
        }
        if ('error' in record.data) {
            return {
                status: 'completed',
                queryId: record.queryId,
                data: record.data,
            };
        }
        // validate that necessary elements are presented on the page
        const resultDataIds = record.data.result.elements.map((re) => re.dataId);
        if (resultDataIds.length > 0) {
            const pageContainsRefs = await this.pageClient.containsElements(pageId, resultDataIds);
            if (!pageContainsRefs) {
                return {
                    status: 'stale',
                    queryId: record.queryId,
                    data: record.data,
                };
            }
        }
        return {
            status: 'completed',
            queryId: record.queryId,
            data: record.data,
        };
    }

    /** Clears the completed query currently displayed by the requesting popup. */
    handleClearQuery(message: ClearQueryMessage, context: MessageContext): Promise<boolean> {
        const pageId = requirePageId(context);

        return this.querySessionStorage.removeCompleted(pageId, message.data.queryId);
    }

    /** Returns saved questions for the sender page's domain. */
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
