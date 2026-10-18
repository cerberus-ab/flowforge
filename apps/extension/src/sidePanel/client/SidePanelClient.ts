import type { TransportService } from '@/adapters';
import type { SidePanelInspectorClient } from './contract';

/**
 * Provides tab-specific side-panel operations to background handlers.
 * Chrome panel configuration and typed panel notifications stay behind this client.
 */
export class SidePanelClient implements SidePanelInspectorClient {
    private readonly path: string;
    private readonly transport: TransportService;

    constructor(path: string, transport: TransportService) {
        this.path = path;
        this.transport = transport;
    }

    /** Enables the side panel for a page before the user opens it. */
    prepareForPage(pageId: number): Promise<void> {
        return chrome.sidePanel.setOptions({
            tabId: pageId,
            path: `${this.path}?pageId=${pageId}`,
            enabled: true,
        });
    }

    /** Opens the side panel for a page in response to a user action. */
    openForPage(pageId: number): Promise<void> {
        return chrome.sidePanel.open({ tabId: pageId });
    }

    /** Requests an Inspector refresh in the side panel bound to the page. */
    async notifyPageInspectorRefresh(pageId: number, tab?: string): Promise<void> {
        const response = await this.transport.sendToSidePanel(
            { type: 'REFRESH_PAGE_INSPECTOR', data: { tab } },
            { pageId },
        );
        if (!response.success) throw new Error(response.error);
    }
}
