export interface SidePanelClient {
    prepare(pageId: number): Promise<void>;
    open(pageId: number): Promise<void>;
}

/** Configures and opens a tab-specific Chrome side panel. */
export class ChromeSidePanelClient implements SidePanelClient {
    private readonly path: string;

    constructor(path: string) {
        this.path = path;
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
}
