import type { AgentResult, AgentResultElement, PageTrailDto } from '@flowforge/contract';

import type { TransportService } from '@/adapters';
import {
    type BackgroundMessage,
    type BackgroundMessageResponseData,
    type MessageContext,
    isClearPageMessage,
    isCollectPageTrailMessage,
    isHighlightElementMessage,
    isOpenInspectorMessage,
    isQueryFinishedMessage,
    isSettingsUpdatedMessage,
    isStartOnboardingMessage,
    type PreviousQuestionsResponse,
    type RestoreQueryResponse,
    type AskQuestionResponse,
    isContainsElementsMessage,
} from '@/messaging';
import type { ExtensionSettings } from '@/types';
import type {
    InspectorPageBackgroundClient,
    InspectorPageMessageCallbacks,
    InspectorPopupBackgroundClient,
    PageInspectorDataBackgroundClient,
    PageBackgroundClient,
    PageMessageCallbacks,
    PopupBackgroundClient,
    SettingsBackgroundClient,
    SettingsMessageCallbacks,
    PopupMessageCallbacks,
} from './contract';
import { MessageRouter, type MessageRoute } from '@/messaging';

/**
 * Provides typed UI/page operations through the background worker.
 * It also routes messages sent back from background to registered callbacks.
 * Context and response handling are centralized so callers use capability methods.
 */
export class BackgroundClient
    implements
        PopupBackgroundClient,
        PageBackgroundClient,
        SettingsBackgroundClient,
        InspectorPopupBackgroundClient,
        PageInspectorDataBackgroundClient,
        InspectorPageBackgroundClient
{
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    /** Sends a typed message with the specified or active page context and unwraps its response. */
    private async sendToBackground<M extends BackgroundMessage>(
        message: M,
        targetContext?: MessageContext,
    ): Promise<BackgroundMessageResponseData<M>> {
        const context = targetContext ?? (await this.transport.getActivePageContext());
        const response = await this.transport.sendToBackground(message, context);

        if (!response.success) {
            throw new Error(response.error);
        }
        return ('data' in response ? response.data : undefined) as BackgroundMessageResponseData<M>;
    }

    /** Notifies background that the popup has opened. */
    async notifyPopupOpened(): Promise<void> {
        return this.sendToBackground({
            type: 'POPUP_OPENED',
        });
    }

    /** Restores the saved query session for the active page. */
    async restoreQuery(): Promise<RestoreQueryResponse> {
        return this.sendToBackground({
            type: 'RESTORE_QUERY',
        });
    }

    /** Clears the matching completed query session for the active page. */
    async clearQuery(queryId: string): Promise<boolean> {
        return this.sendToBackground({
            type: 'CLEAR_QUERY',
            data: { queryId },
        });
    }

    /** Retrieves question history for the active page. */
    async getPreviousQuestions(): Promise<PreviousQuestionsResponse> {
        return this.sendToBackground({
            type: 'GET_PREV_QUESTIONS',
        });
    }

    /** Submits a question along with the active page context. */
    async askQuestion(question: string): Promise<AskQuestionResponse> {
        return this.sendToBackground({
            type: 'ASK_QUESTION',
            data: { question },
        });
    }

    /** Asks background to open onboarding on the active page. */
    async openOnboarding(question: string, result: AgentResult): Promise<void> {
        return this.sendToBackground({
            type: 'OPEN_ONBOARDING',
            data: { question, result },
        });
    }

    /** Navigates the active page to an element returned by the agent. */
    async navigateToElement(element: AgentResultElement): Promise<void> {
        return this.sendToBackground({
            type: 'NAVIGATE_TO_ELEMENT',
            data: { element },
        });
    }

    /** Opens the PageTrail Inspector on the active page. */
    async openPageInspector(tab?: string): Promise<void> {
        return this.sendToBackground({
            type: 'OPEN_PAGE_INSPECTOR',
            data: { tab },
        });
    }

    /** Prepares the Inspector side panel for the active page before a user click. */
    preparePageInspector(): Promise<number> {
        return this.sendToBackground({ type: 'PREPARE_PAGE_INSPECTOR' });
    }

    /** Opens the prepared side panel without resolving the page context on the click path. */
    openPageInspectorForPage(pageId: number): Promise<void> {
        return this.sendToBackground({ type: 'OPEN_PAGE_INSPECTOR', data: {} }, { pageId });
    }

    /** Requests fresh Inspector data for the specified page. */
    async getPageInspectorData(pageId: number): Promise<PageTrailDto> {
        return this.sendToBackground({ type: 'GET_PAGE_INSPECTOR_DATA' }, { pageId });
    }

    /** Reads the current extension settings from background. */
    async getSettings(): Promise<ExtensionSettings> {
        return this.sendToBackground({
            type: 'GET_SETTINGS',
        });
    }

    /** Applies a settings patch and returns the updated settings. */
    async updateSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
        return this.sendToBackground({
            type: 'UPDATE_SETTINGS',
            data: { patch },
        });
    }

    /** Subscribes to popup messages for the active page. */
    subscribeToPopupMessages(callbacks: PopupMessageCallbacks): () => void {
        const pageContext = this.transport.getActivePageContext();
        return this.subscribeToMessages([
            MessageRouter.route(isQueryFinishedMessage, async (message, context) => {
                const { pageId } = await pageContext;
                if (pageId === undefined || context.pageId !== pageId) return;
                callbacks.onQueryFinished(message.data);
            }),
        ]);
    }

    /** Subscribes to settings updates initiated by background. */
    subscribeToSettingsMessages(callbacks: SettingsMessageCallbacks): () => void {
        return this.subscribeToMessages([
            MessageRouter.route(isSettingsUpdatedMessage, (message) => callbacks.onSettingsUpdated(message.data)),
        ]);
    }

    /** Subscribes to page commands sent by background. */
    subscribeToPageMessages(callbacks: PageMessageCallbacks): () => void {
        return this.subscribeToMessages([
            MessageRouter.route(isCollectPageTrailMessage, (message) =>
                message.data.contextOnly ? callbacks.onCollectPageTrailContextOnly() : callbacks.onCollectPageTrail(),
            ),
            MessageRouter.route(isContainsElementsMessage, (message) => callbacks.onContainsElements(message.data)),
            MessageRouter.route(isClearPageMessage, () => callbacks.onClearPage()),
            MessageRouter.route(isStartOnboardingMessage, (message) => callbacks.onStartOnboarding(message.data)),
            MessageRouter.route(isHighlightElementMessage, (message) => callbacks.onHighlightElement(message.data)),
            MessageRouter.route(isOpenInspectorMessage, (message) => callbacks.onOpenInspector(message.data)),
        ]);
    }

    /** Subscribes to the subset of page commands used by the Inspector. */
    subscribeToInspectorPageMessages(callbacks: InspectorPageMessageCallbacks): () => void {
        return this.subscribeToMessages([
            MessageRouter.route(isCollectPageTrailMessage, () => callbacks.onCollectPageTrailContextOnly()),
        ]);
    }

    /** Registers message routes and returns a function that removes the listener. */
    private subscribeToMessages(routes: readonly MessageRoute[]): () => void {
        const router = new MessageRouter(routes);
        return this.transport.addMessageListener(router.handle);
    }
}
