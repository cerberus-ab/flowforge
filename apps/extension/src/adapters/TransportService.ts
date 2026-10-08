export type Message<D = undefined> = D extends undefined ? { type: string } : { type: string; data: D };

export type Response<D = undefined> =
    (D extends undefined ? { success: true } : { success: true; data: D }) | { success: false; error: string };

export interface TransportService {
    /**
     * Returns identifier of the current active page (e.g., active tab).
     */
    getActivePageId(): Promise<number>;

    /**
     * Resolves hostname for the given page.
     */
    getPageHostname(pageId: number): Promise<string>;

    /**
     * Sends a message to the background and returns a typed response.
     */
    sendToBackground<M extends Message, R extends Response = Response>(message: M): Promise<R>;

    /**
     * Sends a message to a specific page context (e.g., tab) by pageId.
     */
    sendToPage<M extends Message, R extends Response = Response>(pageId: number, message: M): Promise<R>;

    /**
     * Adds a listener for incoming messages. Returns a function to remove the listener.
     */
    addMessageListener<R extends Response = Response>(
        handler: (message: Message) => Promise<R> | R | undefined,
    ): () => void;
}
