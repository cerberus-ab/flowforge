import type { TransportService } from '@/adapters';

export interface SidePanelClient {
    prepare(pageId: number): Promise<void>;
    open(pageId: number): Promise<void>;
    notifyRefresh(pageId: number): Promise<void>;
}

/** Configures and opens a tab-specific Chrome side panel. */
export class ChromeSidePanelClient implements SidePanelClient {
    private readonly path: string;
    private readonly transport: TransportService;

    constructor(path: string, transport: TransportService) {
        this.path = path;
        this.transport = transport;
    }

    prepare(pageId: number): Promise<void> {
        return chrome.sidePanel.setOptions({
            tabId: pageId,
            path: `${this.path}?pageId=${pageId}`,
            enabled: true,
        });
    }

    open(pageId: number): Promise<void> {
        return chrome.sidePanel.open({ tabId: pageId });
    }

    async notifyRefresh(pageId: number): Promise<void> {
        await this.transport.sendToSidePanel({ type: 'REFRESH_PAGE_INSPECTOR' }, { pageId });
    }
}
