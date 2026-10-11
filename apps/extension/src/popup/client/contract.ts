export interface PopupQueryClient {
    notifyQueryFinished(queryId: string): Promise<void>;
}
