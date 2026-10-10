import type { PageNavigationClient } from '@/page/client/contract';
import { requirePageId, type MessageContext, type NavigateToElementMessage } from '@/messaging';

/**
 * Handles navigation to an element selected from a result.
 * It clears existing page UI before forwarding the highlight command to the
 * sender page.
 */
export class ElementNavigationMessageHandler {
    private readonly pageClient: PageNavigationClient;

    constructor(pageClient: PageNavigationClient) {
        this.pageClient = pageClient;
    }

    async handleNavigateToElement(message: NavigateToElementMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);
        await this.pageClient.clearPage(pageId);
        await this.pageClient.highlightElement(pageId, message.data.element);
    }
}
