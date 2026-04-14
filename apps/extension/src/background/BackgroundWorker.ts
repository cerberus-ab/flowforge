import type { TransportService } from '#self/adapters/interface';
import { ApiClient } from '#self/core/services/ApiClient';
import { HistoryStorage } from '#self/core/services/HistoryStorage';
import {
    type ApplySettingsMessage,
    type AskQuestionMessage,
    type AskQuestionMessageResponse,
    type ClearPageMessage,
    type CollectPageDataMessage,
    type CollectPageDataMessageResponse,
    type GetPrevQuestionsMessage,
    type GetPrevQuestionsMessageResponse,
    type GetSettingsMessage,
    type GetSettingsMessageResponse,
    type HighlightElementMessage,
    isGetSettingsMessage,
    isUpdateSettingsMessage,
    type Message,
    type MessageResponse,
    type NavigateToElementMessage,
    type StartOnboardingMessage,
    type UpdateSettingsMessage,
    type UpdateSettingsMessageResponse,
} from '#self/types';
import { isAskQuestionMessage, isGetPrevQuestionsMessage, isNavigateToElementMessage } from '#self/types';
import type { QueryRequest } from '@flowforge/shared';
import type { SettingsStorage } from '#self/core/services/SettignsStorage';

export class BackgroundWorker {
    private readonly transport: TransportService;
    private readonly apiClient: ApiClient;
    private readonly historyStorage: HistoryStorage;
    private readonly settingsStorage: SettingsStorage;

    constructor(
        transport: TransportService,
        apiClient: ApiClient,
        historyStorage: HistoryStorage,
        settingsStorage: SettingsStorage,
    ) {
        this.transport = transport;
        this.apiClient = apiClient;
        this.historyStorage = historyStorage;
        this.settingsStorage = settingsStorage;
    }

    start(): void {
        this.transport.addMessageListener((message: Message) => {
            if (isGetSettingsMessage(message)) {
                return this.handleGetSettings(message);
            }
            if (isUpdateSettingsMessage(message)) {
                return this.handleUpdateSettings(message);
            }
            if (isAskQuestionMessage(message)) {
                return this.handleAskQuestion(message);
            }
            if (isGetPrevQuestionsMessage(message)) {
                return this.handleGetPrevQuestions(message);
            }
            if (isNavigateToElementMessage(message)) {
                return this.handleNavigateToElement(message);
            }
        });
        console.log('[FlowForge] Background worker loaded and started');
    }

    /**
     * Retrieves extension settings from storage
     *
     * @param message - Incoming background message
     * @returns A successful response containing the stored settings.
     * @throws Rethrows any error that occurs while reading settings storage.
     */
    private async handleGetSettings(message: GetSettingsMessage): Promise<GetSettingsMessageResponse> {
        try {
            const settings = await this.settingsStorage.get();
            return { success: true, data: settings };
        } catch (error) {
            console.error('[Background] Error getting extension settings:', error);
            throw error;
        }
    }

    /**
     * Updates extension settings with a partial patch
     *
     * @param message - Incoming background message containing a settings patch.
     * @returns A successful response containing the updated settings.
     * @throws Rethrows any error that occurs while writing settings storage.
     */
    private async handleUpdateSettings(message: UpdateSettingsMessage): Promise<UpdateSettingsMessageResponse> {
        try {
            const updatedSettings = await this.settingsStorage.update(message.data.patch);
            // Apply updated settings to the page
            await this.transport.sendToPage<ApplySettingsMessage>(message.senderId, {
                type: 'APPLY_SETTINGS',
                data: { settings: updatedSettings },
            });
            return { success: true, data: updatedSettings };
        } catch (error) {
            console.error('[Background] Error updating extension settings:', error);
            throw error;
        }
    }

    /**
     * Handles a user question for the given tab.
     *
     * Clears existing highlights, collects page data from the page,
     * sends the query to the backend, highlights matched elements, and stores
     * the question in domain-specific history.
     *
     * @param message - Message containing the tab ID and user question.
     * @returns Promise resolving to a successful response with the query result.
     * @throws Rethrows any error that occurs during page data collection,
     * backend querying, highlighting, or history persistence.
     */
    private async handleAskQuestion(message: AskQuestionMessage): Promise<AskQuestionMessageResponse> {
        try {
            // Clear existing highlights
            await this.transport.sendToPage<ClearPageMessage>(message.senderId, {
                type: 'CLEAR_PAGE',
            });
            // Get page data from a page context
            const pageDataResponse = await this.transport.sendToPage<
                CollectPageDataMessage,
                CollectPageDataMessageResponse
            >(message.senderId, { type: 'COLLECT_PAGE_DATA' });
            if (!pageDataResponse.success) {
                throw new Error('Failed to collect page data: ' + pageDataResponse.error);
            }
            console.log('[Background] Collected page data:', pageDataResponse);

            const pageData = pageDataResponse.data;
            const domain = await this.transport.getSenderHostname(message.senderId);

            // Send it to the backend server
            const requestData: QueryRequest = {
                question: message.data.question,
                pageData,
                domain,
                userContext: {
                    previousQuestions: await this.historyStorage.getPreviousQuestions(domain),
                },
            };
            console.log('[Background] Sending request to server:', requestData);
            const responseData = await this.apiClient.query(requestData);
            console.log('[Background] Received response from server:', responseData);
            const result = responseData.result;

            // Send highlight command to a page
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
            // Save question to history
            await this.historyStorage.saveQuestion(domain, message.data.question);
            return { success: true, data: responseData };
        } catch (error) {
            console.error('[Background] Error handling question:', error);
            throw error;
        }
    }

    /**
     * Retrieves previously asked questions for the domain of the active tab.
     *
     * @param message - Message containing the tab identifier.
     * @returns Promise resolving to a successful response with prior questions.
     * @throws Rethrows any error that occurs while resolving tab domain or reading history.
     */
    private async handleGetPrevQuestions(message: GetPrevQuestionsMessage): Promise<GetPrevQuestionsMessageResponse> {
        try {
            const domain = await this.transport.getSenderHostname(message.senderId);
            const questions = await this.historyStorage.getPreviousQuestions(domain);
            return { success: true, data: { questions } };
        } catch (error) {
            console.error('[Background] Error getting previous questions:', error);
            throw error;
        }
    }

    /**
     * Navigates to a specific element by resetting current highlights and applying
     * a new highlight target in the active page.
     *
     * @param message - Message containing sender tab id and element navigation payload.
     * @returns Promise resolving to a success response when highlight commands are sent.
     * @throws Rethrows any error from content messaging operations.
     */
    private async handleNavigateToElement(message: NavigateToElementMessage): Promise<MessageResponse> {
        try {
            // Clear existing highlights
            await this.transport.sendToPage<ClearPageMessage>(message.senderId, {
                type: 'CLEAR_PAGE',
            });
            // Highlight the element
            await this.transport.sendToPage<HighlightElementMessage>(message.senderId, {
                type: 'HIGHLIGHT_ELEMENT',
                data: message.data,
            });
            return { success: true };
        } catch (error) {
            console.error('[Background] Error navigating to element:', error);
            throw error;
        }
    }
}
