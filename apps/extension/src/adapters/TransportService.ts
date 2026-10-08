// transport service contract
export type Message<D = undefined> = D extends undefined ? { type: string } : { type: string; data: D };

export type PageMessage<D = undefined> = Message<D> & { pageId: number };

export type MessageResponse<D = undefined> =
    (D extends undefined ? { success: true } : { success: true; data: D }) | { success: false; error: string };

// transport service interface
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
    sendToBackground<R extends MessageResponse = MessageResponse>(message: PageMessage): Promise<R>;

    /**
     * Sends a message to a specific page context (e.g., tab) by pageId.
     */
    sendToPage<R extends MessageResponse = MessageResponse>(pageId: number, message: Message): Promise<R>;

    /**
     * Adds a listener for incoming messages. Returns a function to remove the listener.
     */
    addMessageListener<R extends MessageResponse = MessageResponse>(
        handler: (message: Message) => Promise<R> | R | undefined,
    ): () => void;
}
