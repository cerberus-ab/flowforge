import type { TransportService } from '@/adapters';
import type {
    AnyMessageResponse,
    BackgroundMessage,
    BackgroundMessageResponse,
    Message,
    MessageListener,
    PageMessage,
    PageMessageResponse,
    PageScopedMessage,
} from '@/messaging';

/**
 * Chrome-based implementation of TransportService
 *
 * Uses chrome.runtime and chrome.tabs APIs to:
 * - resolve active page (tab) context
 * - send messages to background and content scripts
 * - listen for incoming runtime messages
 *
 * Chrome-specific details (e.g. tabId) are handled internally.
 */
export class ChromeTransportService implements TransportService {
    public async getActivePageId(): Promise<number> {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            throw new Error('Active tab not found');
        }
        return tab.id;
    }

    public async getPageHostname(pageId: number): Promise<string> {
        const tab = await chrome.tabs.get(pageId);
        if (!tab.url) {
            throw new Error('Tab URL is not available');
        }
        return new URL(tab.url).hostname;
    }

    public async sendToBackground<M extends BackgroundMessage>(
        message: PageScopedMessage<M>,
    ): Promise<BackgroundMessageResponse<M>> {
        return chrome.runtime.sendMessage<PageScopedMessage<M>, BackgroundMessageResponse<M>>(message);
    }

    public async sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponse<M>> {
        return chrome.tabs.sendMessage<M, PageMessageResponse<M>>(pageId, message);
    }

    public addMessageListener(handler: MessageListener): () => void {
        const listener = (
            message: Message,
            _sender: chrome.runtime.MessageSender,
            sendResponse: (response: AnyMessageResponse) => void,
        ): boolean => {
            const response = handler(message);

            if (response === undefined) {
                return false;
            }
            Promise.resolve(response)
                .then(sendResponse)
                .catch((reason: unknown) => {
                    sendResponse({
                        success: false,
                        error: reason instanceof Error ? reason.message : String(reason),
                    });
                });
            return true;
        };

        chrome.runtime.onMessage.addListener(listener);

        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }
}
