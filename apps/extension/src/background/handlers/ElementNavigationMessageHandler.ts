import type { Message, MessageResponse, TransportService } from '@/adapters';
import { type HighlightElementMessage, isNavigateToElementMessage, type NavigateToElementMessage } from '@/types';

import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles navigation to an element selected from a result.
 * It clears existing page UI before forwarding the highlight command to the
 * sender page.
 */
export class ElementNavigationMessageHandler implements BackgroundMessageHandler {
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    /** Routes supported element navigation messages to their operations. */
    handle(message: Message): Promise<MessageResponse> | undefined {
        if (isNavigateToElementMessage(message)) return this.handleNavigateToElement(message);
        return undefined;
    }

    /** Clears the page state and highlights the requested element. */
    private async handleNavigateToElement(message: NavigateToElementMessage): Promise<MessageResponse> {
        await this.transport.sendToPage(message.pageId, {
            type: 'CLEAR_PAGE',
        });
        const highlightMessage: HighlightElementMessage = {
            type: 'HIGHLIGHT_ELEMENT',
            data: message.data,
        };
        await this.transport.sendToPage(message.pageId, highlightMessage);
        return { success: true };
    }
}
