import type { PageInspectorClient } from '@/page/client/contract';
import {
    MessageRouter,
    isOpenPageInspectorMessage,
    requirePageId,
    type MessageContext,
    type OpenPageInspectorMessage,
} from '@/messaging';
import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles requests to open the PageTrail Inspector on a sender page.
 * Clears existing extension UI before opening the requested inspector tab.
 * Used by both the Assistant and standalone Inspector background workers.
 */
export class PageInspectorMessageHandler implements BackgroundMessageHandler {
    private readonly pageClient: PageInspectorClient;

    constructor(pageClient: PageInspectorClient) {
        this.pageClient = pageClient;
    }

    routes() {
        return [
            MessageRouter.route(isOpenPageInspectorMessage, (message, context) =>
                this.handleOpenPageInspector(message, context),
            ),
        ];
    }

    /** Clears the page and opens the requested inspector tab. */
    async handleOpenPageInspector(message: OpenPageInspectorMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);

        await this.pageClient.clearPage(pageId);
        await this.pageClient.openInspector(pageId, message.data.tab);
    }
}
