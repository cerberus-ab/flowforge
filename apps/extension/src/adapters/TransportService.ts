import type {
    BackgroundMessage,
    BackgroundMessageResponse,
    MessageListener,
    PageMessage,
    PageMessageResponse,
    PageScopedMessage,
} from '@/messaging';

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
    sendToBackground<M extends BackgroundMessage>(message: PageScopedMessage<M>): Promise<BackgroundMessageResponse<M>>;

    /**
     * Sends a message to a specific page context (e.g., tab) by pageId.
     */
    sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponse<M>>;

    /**
     * Adds a listener for incoming messages. Returns a function to remove the listener.
     */
    addMessageListener(handler: MessageListener): () => void;
}
