import type { TransportService } from '@/adapters/interface';
import {
    type ClearPageMessage,
    type HighlightElementMessage,
    isNavigateToElementMessage,
    type Message,
    type MessageResponse,
    type NavigateToElementMessage,
} from '@/types';

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
        await this.transport.sendToPage<ClearPageMessage>(message.senderId, {
            type: 'CLEAR_PAGE',
        });
        await this.transport.sendToPage<HighlightElementMessage>(message.senderId, {
            type: 'HIGHLIGHT_ELEMENT',
            data: message.data,
        });
        return { success: true };
    }
}
