import type { AgentResultElement, QueryResponse } from '@flowforge/contract';

import type { Message, MessageResponse, TransportService } from '@/adapters';
import {
    type ExtensionSettings,
    type GetPrevQuestionsMessageResponseData,
    isClearPageMessage,
    isCollectPageTrailMessage,
    isHighlightElementMessage,
    isOpenInspectorMessage,
    isSettingsUpdatedMessage,
    isStartOnboardingMessage,
} from '@/types';
import type {
    InspectorPageBackgroundClient,
    InspectorPageCommandHandlers,
    InspectorPopupBackgroundClient,
    PageBackgroundClient,
    PageCommandHandlers,
    PopupBackgroundClient,
    SettingsBackgroundClient,
    SettingsCommandHandlers,
} from '@/background/client/contract';
import { MessageRouter, type MessageRoute } from '@/background/MessageRouter';

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

    private async sendToBackground<D = undefined>(message: Message | Message<unknown>): Promise<D> {
        const pageMessage = {
            ...message,
            pageId: await this.transport.getActivePageId(),
        };
        const response = await this.transport.sendToBackground<MessageResponse<D>>(pageMessage);

        if (!response.success) {
            throw new Error(response.error);
        }
        return ('data' in response ? response.data : undefined) as D;
    }

    async initializePopup(): Promise<void> {
        return this.sendToBackground({
            type: 'POPUP_INITIALISE',
        });
    }

    async getPreviousQuestions(): Promise<string[]> {
        const response = await this.sendToBackground<GetPrevQuestionsMessageResponseData>({
            type: 'GET_PREV_QUESTIONS',
        });
        return response.questions;
    }

    async askQuestion(question: string): Promise<QueryResponse> {
        return this.sendToBackground<QueryResponse>({
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
        return this.sendToBackground<ExtensionSettings>({
            type: 'GET_SETTINGS',
        });
    }

    async updateSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
        return this.sendToBackground<ExtensionSettings>({
            type: 'UPDATE_SETTINGS',
            data: { patch },
        });
    }

    subscribeToSettingsCommands(handlers: SettingsCommandHandlers): () => void {
        return this.subscribeToCommands([
            MessageRouter.route(isSettingsUpdatedMessage, (message) => handlers.settingsUpdated(message.data)),
        ]);
    }

    subscribeToPageCommands(handlers: PageCommandHandlers): () => void {
        return this.subscribeToCommands([
            MessageRouter.route(isCollectPageTrailMessage, () => handlers.collectPageTrail()),
            MessageRouter.route(isClearPageMessage, () => handlers.clearPage()),
            MessageRouter.route(isStartOnboardingMessage, (message) => handlers.startOnboarding(message.data)),
            MessageRouter.route(isHighlightElementMessage, (message) =>
                handlers.highlightElement(message.data.element),
            ),
            MessageRouter.route(isOpenInspectorMessage, (message) => handlers.openInspector(message.data.tab)),
        ]);
    }

    subscribeToInspectorPageCommands(handlers: InspectorPageCommandHandlers): () => void {
        return this.subscribeToCommands([
            MessageRouter.route(isClearPageMessage, () => handlers.clearPage()),
            MessageRouter.route(isOpenInspectorMessage, (message) => handlers.openInspector(message.data.tab)),
        ]);
    }

    private subscribeToCommands(routes: readonly MessageRoute[]): () => void {
        const router = new MessageRouter(routes);
        return this.transport.addMessageListener(router.handle);
    }
}
