export interface PopupQueryClient {
    notifyQueryFinished(pageId: number, queryId: string): Promise<void>;
}
