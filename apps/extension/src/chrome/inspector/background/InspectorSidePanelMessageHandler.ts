import type { PageTrailDto } from '@flowforge/contract';

import type { BackgroundMessageHandler } from '@/background/worker/handlers/BackgroundMessageHandler';
import type { SidePanelClient } from './SidePanelClient';
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
 * Manages the standalone Inspector side panel lifecycle.
 * Prepares a tab-specific panel before the popup click, opens it on the click,
 * and returns fresh page data when the panel requests it.
 */
export class InspectorSidePanelMessageHandler implements BackgroundMessageHandler {
    private readonly sidePanel: SidePanelClient;
    private readonly pageClient: PageInspectorDataClient;

    constructor(sidePanel: SidePanelClient, pageClient: PageInspectorDataClient) {
        this.sidePanel = sidePanel;
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
        await this.sidePanel.prepare(pageId);
        return pageId;
    }

    /** Opens the panel immediately, then refreshes it if it was already mounted. */
    async handleOpenPageInspector(_message: OpenPageInspectorMessage, context: MessageContext): Promise<void> {
        const pageId = requirePageId(context);
        await this.sidePanel.open(pageId);
        void this.sidePanel.notifyRefresh(pageId).catch(() => undefined);
    }

    /** Returns a fresh context-only page trail to the panel. */
    handleGetPageInspectorData(_message: GetPageInspectorDataMessage, context: MessageContext): Promise<PageTrailDto> {
        return this.pageClient.collectPageTrailContextOnly(requirePageId(context));
    }
}
