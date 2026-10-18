export interface SidePanelInspectorClient {
    prepareForPage(pageId: number): Promise<void>;
    openForPage(pageId: number): Promise<void>;
    notifyPageInspectorRefresh(pageId: number, tab?: string): Promise<void>;
}
