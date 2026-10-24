import type { PageTrailDto } from '@flowforge/contract';

import type { BackgroundMessageHandler } from './BackgroundMessageHandler';
import type { SidePanelInspectorClient } from '@/sidePanel/client/contract';
import type { PageInspectorDataClient } from '@/page/client/contract';
import {
    isGetPageInspectorData,
    isOpenPageInspectorMessage,
    isPreparePageInspectorMessage,
    MessageRouter,
    requirePageId,
    type GetPageInspectorDataMessage,
    type MessageContext,
    type OpenPageInspectorMessage,
    type PreparePageInspectorMessage,
} from '@/messaging';

/**
 * Routes side-panel requests in the background worker.
 * Prepares and opens the tab-bound panel for popup actions.
 * Its Inspector route collects the page data rendered inside that panel.
 */
export class SidePanelMessageHandler implements BackgroundMessageHandler {
    private readonly sidePanelClient: SidePanelInspectorClient;
    private readonly pageClient: PageInspectorDataClient;

    constructor(sidePanel: SidePanelInspectorClient, pageClient: PageInspectorDataClient) {
        this.sidePanelClient = sidePanel;
        this.pageClient = pageClient;
    }

    routes() {
        return [
            MessageRouter.route(isPreparePageInspectorMessage, (message, context) =>
                this.handlePreparePageInspector(message, context),
            ),
            MessageRouter.route(isOpenPageInspectorMessage, (message, context) =>
                this.handleOpenPageInspector(message, context),
            ),
            MessageRouter.route(isGetPageInspectorData, (message, context) =>
                this.handleGetPageInspectorData(message, context),
            ),
        ];
    }

    /** Prepares the panel and returns the page ID for the later click. */
    async handlePreparePageInspector(_message: PreparePageInspectorMessage, context: MessageContext): Promise<number> {
        const pageId = requirePageId(context);
        await this.sidePanelClient.prepareForPage(pageId);
        return pageId;
    }

    /** Opens the panel immediately, then refreshes it if it was already mounted. */
    async handleOpenPageInspector(message: OpenPageInspectorMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);
        await this.sidePanelClient.openForPage(pageId);
        void this.notifyWhenReady(pageId, message.data.tab);
    }

    /** Returns a fresh context-only page trail to the panel. */
    handleGetPageInspectorData(_message: GetPageInspectorDataMessage, context: MessageContext): Promise<PageTrailDto> {
        const pageId = requirePageId(context);
        return this.pageClient.collectPageTrailContextOnly(pageId);
    }

    /** First opening may precede panel listener registration; retry the selected tab briefly. */
    private async notifyWhenReady(pageId: number, tab?: string): Promise<void> {
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                await this.sidePanelClient.notifyPageInspectorRefresh(pageId, tab);
                return;
            } catch {
                if (attempt === 4) return;
                await new Promise<void>((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
            }
        }
    }
}
