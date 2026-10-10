import type { PageInspectorClient } from '@/page/client/contract';
import type { OpenPageInspectorMessage, PageScopedMessage } from '@/messaging';

/**
 * Handles requests to open the shared PageTrail Inspector on the sender page.
 * It clears existing extension UI before forwarding the requested Inspector tab
 * through the page transport.
 */
export class PageInspectorMessageHandler {
    private readonly pageClient: PageInspectorClient;

    constructor(pageClient: PageInspectorClient) {
        this.pageClient = pageClient;
    }

    async handleOpenPageInspector(message: PageScopedMessage<OpenPageInspectorMessage>): Promise<void> {
        await this.pageClient.clearPage(message.pageId);
        await this.pageClient.openInspector(message.pageId, message.data.tab);
    }
}
