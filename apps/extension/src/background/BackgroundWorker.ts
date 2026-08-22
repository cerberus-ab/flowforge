import type { TransportService } from '@/adapters/interface';
import type { ApiClient } from '@/core/services/ApiClient';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import {
    type AskQuestionMessage,
    type AskQuestionMessageResponse,
    type ClearPageMessage,
    type CollectPageTrailMessage,
    type CollectPageTrailMessageResponse,
    type GetPrevQuestionsMessage,
    type GetPrevQuestionsMessageResponse,
    type GetSettingsMessageResponse,
    type HighlightElementMessage,
    isGetSettingsMessage,
    isOpenPageInspectorMessage,
    isPopupInitializeMessage,
    isUpdateSettingsMessage,
    type Message,
    type MessageResponse,
    type NavigateToElementMessage,
    type OpenInspectorMessage,
    type OpenPageInspectorMessage,
    type PopupInitializeMessage,
    type SettingsUpdatedMessage,
    type StartOnboardingMessage,
    type UpdateSettingsMessage,
    type UpdateSettingsMessageResponse,
} from '@/types';
import { isAskQuestionMessage, isGetPrevQuestionsMessage, isNavigateToElementMessage } from '@/types';
import type { QueryRequest } from '@flowforge/contract';
import type { SettingsStorage } from '@/core/services/SettingsStorage';

export class BackgroundWorker {
    private readonly transport: TransportService;
    private unsubscribe?: () => void;
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
        this.unsubscribe = this.transport.addMessageListener((message: Message) => {
            if (isPopupInitializeMessage(message)) {
                return this.handlePopupInitialize(message);
            }
            if (isGetSettingsMessage(message)) {
                return this.handleGetSettings();
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
            if (isOpenPageInspectorMessage(message)) {
                return this.handleOpenPageInspector(message);
            }
        });
        console.log('[FlowForge] Background worker loaded and started');
    }

    stop(): void {
        this.unsubscribe?.();
        console.log('[FlowForge] Background worker stopped');
    }

    /**
     * Clears page UI state when the popup opens.
     *
     * This intentionally does not await the page response. Opening the popup must
     * not depend on content script availability or page runtime health.
     *
     * @param message - Popup initialization message containing the target sender ID.
     */
    private handlePopupInitialize(message: PopupInitializeMessage): MessageResponse {
        void this.transport
            .sendToPage<ClearPageMessage>(message.senderId, {
                type: 'CLEAR_PAGE',
            })
            .catch(() => undefined);

        return { success: true };
    }

    /**
     * Retrieves extension settings from storage
     *
     * @returns A successful response containing the stored settings.
     * @throws Rethrows any error that occurs while reading settings storage.
     */
    private async handleGetSettings(): Promise<GetSettingsMessageResponse> {
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
            if (message.senderId !== undefined) {
                void this.transport.sendToPage<SettingsUpdatedMessage>(message.senderId, {
                    type: 'SETTINGS_UPDATED',
                    data: updatedSettings,
                }).catch(() => undefined);
            }
            return { success: true, data: updatedSettings };
        } catch (error) {
            console.error('[Background] Error updating extension settings:', error);
            throw error;
        }
    }

    /**
     * Handles a user question for the given tab.
     *
     * Clears existing highlights, collects a page trail from the page,
     * sends the query to the backend, highlights matched elements, and stores
     * the question in domain-specific history.
     *
     * @param message - Message containing the tab ID and user question.
     * @returns Promise resolving to a successful response with the query result.
     * @throws Rethrows any error that occurs during page trail collection,
     * backend querying, highlighting, or history persistence.
     */
    private async handleAskQuestion(message: AskQuestionMessage): Promise<AskQuestionMessageResponse> {
        try {
            // Clear page
            await this.transport.sendToPage<ClearPageMessage>(message.senderId, {
                type: 'CLEAR_PAGE',
            });
            // Get a page trail from page runtime
            const pageTrailResponse = await this.transport.sendToPage<
                CollectPageTrailMessage,
                CollectPageTrailMessageResponse
            >(message.senderId, { type: 'COLLECT_PAGE_TRAIL' });
            if (!pageTrailResponse.success) {
                throw new Error('Failed to collect page trail: ' + pageTrailResponse.error);
            }
            console.log('[Background] Collected page trail:', pageTrailResponse);

            const pageTrail = pageTrailResponse.data;
            const domain = await this.transport.getSenderHostname(message.senderId);

            // Send it to the backend server
            const requestData: QueryRequest = {
                question: message.data.question,
                pageTrail: pageTrail,
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
            // Clear page
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

    /**
     * Clears the page state and opens the inspector.
     *
     * @param message - Message with the sender page ID.
     * @returns Success response when the inspector request is sent.
     */
    private async handleOpenPageInspector(message: OpenPageInspectorMessage): Promise<MessageResponse> {
        try {
            // Clear page
            await this.transport.sendToPage<ClearPageMessage>(message.senderId, {
                type: 'CLEAR_PAGE',
            });
            // Open inspector
            await this.transport.sendToPage<OpenInspectorMessage>(message.senderId, {
                type: 'OPEN_INSPECTOR',
                data: message.data,
            });
            return { success: true };
        } catch (error) {
            console.error('[Background] Error opening page inspector:', error);
            throw error;
        }
    }
}
