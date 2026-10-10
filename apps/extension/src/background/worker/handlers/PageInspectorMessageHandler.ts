import type { PageInspectorClient } from '@/page/client/contract';
import { requirePageId, type MessageContext, type OpenPageInspectorMessage } from '@/messaging';

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

    async handleOpenPageInspector(message: OpenPageInspectorMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);
        await this.pageClient.clearPage(pageId);
        await this.pageClient.openInspector(pageId, message.data.tab);
    }
}
