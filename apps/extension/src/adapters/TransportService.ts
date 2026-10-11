import type {
    BackgroundMessage,
    BackgroundMessageResponse,
    MessageContext,
    MessageListener,
    PageMessage,
    PageMessageResponse,
    PopupMessage,
    PopupMessageResponse,
} from '@/messaging';

// transport service interface
export interface TransportService {
    /**
     * Returns the current page context when one is available (e.g., the active tab).
     */
    getActivePageContext(): Promise<MessageContext>;

    /**
     * Resolves url for the given page.
     */
    getPageUrl(pageId: number): Promise<string>;

    /**
     * Sends a message to the background and returns a typed response.
     */
    sendToBackground<M extends BackgroundMessage>(
        message: M,
        context: MessageContext,
    ): Promise<BackgroundMessageResponse<M>>;

    /**
     * Sends a message to a specific page context (e.g., tab) by pageId.
     */
    sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponse<M>>;

    /**
     * Sends a message to popup contexts and returns a typed response.
     */
    sendToPopup<M extends PopupMessage>(message: M): Promise<PopupMessageResponse<M>>;

    /**
     * Adds a listener for incoming messages. Returns a function to remove the listener.
     */
    addMessageListener(handler: MessageListener): () => void;
}
