import type { Message, PageMessage, MessageResponse, TransportService } from '@/adapters';

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

    public async sendToBackground<R extends MessageResponse = MessageResponse>(message: PageMessage): Promise<R> {
        return chrome.runtime.sendMessage<PageMessage, R>(message);
    }

    public async sendToPage<R extends MessageResponse = MessageResponse>(pageId: number, message: Message): Promise<R> {
        return chrome.tabs.sendMessage<Message, R>(pageId, message);
    }

    public addMessageListener<R extends MessageResponse = MessageResponse>(
        handler: (message: Message) => Promise<R> | R | undefined,
    ): () => void {
        const listener = (
            message: Message,
            _sender: chrome.runtime.MessageSender,
            sendResponse: (response: R) => void,
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
                    } as R);
                });
            return true;
        };

        chrome.runtime.onMessage.addListener(listener);

        return () => {
            chrome.runtime.onMessage.removeListener(listener);
        };
    }
}
