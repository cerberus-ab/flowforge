import type { PageNavigationClient } from '@/page/client/contract';
import type { NavigateToElementMessage } from '@/types';

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

    async handleNavigateToElement(message: NavigateToElementMessage): Promise<void> {
        await this.pageClient.clearPage(message.pageId);
        await this.pageClient.highlightElement(message.pageId, message.data.element);
    }
}
