import type { TransportService } from '@/adapters';
import { type HighlightElementMessage, type NavigateToElementMessage } from '@/types';

/**
 * Handles navigation to an element selected from a result.
 * It clears existing page UI before forwarding the highlight command to the
 * sender page.
 */
export class ElementNavigationMessageHandler {
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    async handle(message: NavigateToElementMessage): Promise<void> {
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
