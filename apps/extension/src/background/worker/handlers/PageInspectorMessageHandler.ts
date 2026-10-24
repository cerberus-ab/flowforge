import type { PageInspectorClient } from '@/page/client/contract';
import {
    MessageRouter,
    isGetPageInspectorData,
    isOpenPageInspectorMessage,
    requirePageId,
    type MessageContext,
    type OpenPageInspectorMessage,
    type GetPageInspectorDataMessage,
} from '@/messaging';
import type { PageTrailDto } from '@flowforge/contract';
import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles Inspector opening and snapshot requests for a target page.
 * Clears existing extension UI before opening the requested inspector tab.
 * Collects fresh context-only snapshots for Inspector UI outside the page.
 * Used by the embed worker; Chrome builds use the shared side-panel handler.
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
            MessageRouter.route(isGetPageInspectorData, (message, context) =>
                this.handleGetPageInspectorData(message, context),
            ),
        ];
    }

    /** Clears the page and opens the requested inspector tab. */
    async handleOpenPageInspector(message: OpenPageInspectorMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);

        await this.pageClient.clearPage(pageId);
        await this.pageClient.openInspector(pageId, message.data.tab);
    }

    /** Returns fresh context-only Inspector data from the requested page. */
    handleGetPageInspectorData(_message: GetPageInspectorDataMessage, context: MessageContext): Promise<PageTrailDto> {
        const pageId = requirePageId(context);

        return this.pageClient.collectPageTrailContextOnly(pageId);
    }
}
