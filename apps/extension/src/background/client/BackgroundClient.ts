import type { AgentResultElement, QueryResponse } from '@flowforge/contract';

import type { TransportService } from '@/adapters';
import {
    type BackgroundMessage,
    type BackgroundMessageResponseData,
    isClearPageMessage,
    isCollectPageTrailMessage,
    isHighlightElementMessage,
    isOpenInspectorMessage,
    isSettingsUpdatedMessage,
    isStartOnboardingMessage,
} from '@/messaging';
import type { ExtensionSettings } from '@/types';
import type {
    InspectorPageBackgroundClient,
    InspectorPageMessageCallbacks,
    InspectorPopupBackgroundClient,
    PageBackgroundClient,
    PageMessageCallbacks,
    PopupBackgroundClient,
    SettingsBackgroundClient,
    SettingsMessageCallbacks,
} from './contract';
import { MessageRouter, type MessageRoute } from '@/messaging';

export class BackgroundClient
    implements
        PopupBackgroundClient,
        PageBackgroundClient,
        SettingsBackgroundClient,
        InspectorPopupBackgroundClient,
        InspectorPageBackgroundClient
{
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    private async sendToBackground<M extends BackgroundMessage>(message: M): Promise<BackgroundMessageResponseData<M>> {
        const context = await this.transport.getActivePageContext();
        const response = await this.transport.sendToBackground(message, context);

        if (!response.success) {
            throw new Error(response.error);
        }
        return ('data' in response ? response.data : undefined) as BackgroundMessageResponseData<M>;
    }

    async notifyPopupOpened(): Promise<void> {
        return this.sendToBackground({
            type: 'POPUP_OPENED',
        });
    }

    async getPreviousQuestions(): Promise<string[]> {
        const response = await this.sendToBackground({
            type: 'GET_PREV_QUESTIONS',
        });
        return response.questions;
    }

    async askQuestion(question: string): Promise<QueryResponse> {
        return this.sendToBackground({
            type: 'ASK_QUESTION',
            data: { question },
        });
    }

    async navigateToElement(element: AgentResultElement): Promise<void> {
        return this.sendToBackground({
            type: 'NAVIGATE_TO_ELEMENT',
            data: { element },
        });
    }

    async openPageInspector(tab?: string): Promise<void> {
        return this.sendToBackground({
            type: 'OPEN_PAGE_INSPECTOR',
            data: { tab },
        });
    }

    async getSettings(): Promise<ExtensionSettings> {
        return this.sendToBackground({
            type: 'GET_SETTINGS',
        });
    }

    async updateSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
        return this.sendToBackground({
            type: 'UPDATE_SETTINGS',
            data: { patch },
        });
    }

    subscribeToSettingsMessages(callbacks: SettingsMessageCallbacks): () => void {
        return this.subscribeToMessages([
            MessageRouter.route(isSettingsUpdatedMessage, (message) => callbacks.onSettingsUpdated(message.data)),
        ]);
    }

    subscribeToPageMessages(callbacks: PageMessageCallbacks): () => void {
        return this.subscribeToMessages([
            MessageRouter.route(isCollectPageTrailMessage, () => callbacks.onCollectPageTrail()),
            MessageRouter.route(isClearPageMessage, () => callbacks.onClearPage()),
            MessageRouter.route(isStartOnboardingMessage, (message) => callbacks.onStartOnboarding(message.data)),
            MessageRouter.route(isHighlightElementMessage, (message) =>
                callbacks.onHighlightElement(message.data.element),
            ),
            MessageRouter.route(isOpenInspectorMessage, (message) => callbacks.onOpenInspector(message.data.tab)),
        ]);
    }

    subscribeToInspectorPageMessages(callbacks: InspectorPageMessageCallbacks): () => void {
        return this.subscribeToMessages([
            MessageRouter.route(isClearPageMessage, () => callbacks.onClearPage()),
            MessageRouter.route(isOpenInspectorMessage, (message) => callbacks.onOpenInspector(message.data.tab)),
        ]);
    }

    private subscribeToMessages(routes: readonly MessageRoute[]): () => void {
        const router = new MessageRouter(routes);
        return this.transport.addMessageListener(router.handle);
    }
}
