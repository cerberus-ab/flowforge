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

    async getPreviousQuestions(): Promise<GetPrevQuestionsMessageResponseData> {
        return this.sendToBackground<GetPrevQuestionsMessageResponseData>({
            type: 'GET_PREV_QUESTIONS',
        });
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
        return this.transport.addMessageListener((message) => {
            if (isSettingsUpdatedMessage(message)) {
                handlers.settingsUpdated(message.data);
                return { success: true };
            }
            return undefined;
        });
    }

    subscribeToPageCommands(handlers: PageCommandHandlers): () => void {
        return this.transport.addMessageListener((message) => {
            if (isCollectPageTrailMessage(message)) {
                const data = handlers.collectPageTrail();
                return { success: true, data };
            }
            if (isClearPageMessage(message)) {
                handlers.clearPage();
                return { success: true };
            }
            if (isStartOnboardingMessage(message)) {
                handlers.startOnboarding(message.data);
                return { success: true };
            }
            if (isHighlightElementMessage(message)) {
                handlers.highlightElement(message.data.element);
                return { success: true };
            }
            if (isOpenInspectorMessage(message)) {
                handlers.openInspector(message.data.tab);
                return { success: true };
            }
            return undefined;
        });
    }

    subscribeToInspectorPageCommands(handlers: InspectorPageCommandHandlers): () => void {
        return this.transport.addMessageListener((message) => {
            if (isClearPageMessage(message)) {
                handlers.clearPage();
                return { success: true };
            }
            if (isOpenInspectorMessage(message)) {
                handlers.openInspector(message.data.tab);
                return { success: true };
            }
            return undefined;
        });
    }
}
