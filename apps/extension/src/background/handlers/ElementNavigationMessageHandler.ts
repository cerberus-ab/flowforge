import type { Message, TransportService } from '@/adapters';
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

    resolve(message: Message): (() => Promise<void>) | undefined {
        if (!isNavigateToElementMessage(message)) return undefined;
        return () => this.handleNavigateToElement(message);
    }

    private async handleNavigateToElement(message: NavigateToElementMessage): Promise<void> {
        await this.transport.sendToPage(message.pageId, {
            type: 'CLEAR_PAGE',
        });
        const highlightMessage: HighlightElementMessage = {
            type: 'HIGHLIGHT_ELEMENT',
            data: message.data,
        };
        await this.transport.sendToPage(message.pageId, highlightMessage);
    }
}
