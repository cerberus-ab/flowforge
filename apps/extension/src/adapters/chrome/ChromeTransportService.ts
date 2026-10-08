import type { Message, Response, TransportService } from '@/adapters';

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

    public async sendToBackground<M extends Message, R extends Response = Response>(message: M): Promise<R> {
        return chrome.runtime.sendMessage<M, R>(message);
    }

    public async sendToPage<M extends Message, R extends Response = Response>(pageId: number, message: M): Promise<R> {
        return chrome.tabs.sendMessage<M, R>(pageId, message);
    }

    public addMessageListener<R extends Response = Response>(
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
