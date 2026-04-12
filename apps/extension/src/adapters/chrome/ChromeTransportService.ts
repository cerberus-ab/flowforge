import type { Message, MessageResponse } from '#self/types';
import type { TransportService } from '../interface';

/**
 * Chrome-based implementation of TransportService
 *
 * Uses chrome.runtime and chrome.tabs APIs to:
 * - resolve active sender (tab) context
 * - send messages to background and content scripts
 * - listen for incoming runtime messages
 *
 * Chrome-specific details (e.g. tabId) are handled internally.
 */
export class ChromeTransportService implements TransportService {
    public async getActiveSenderId(): Promise<number> {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) {
            throw new Error('Active tab not found');
        }
        return tab.id;
    }

    public async getSenderHostname(senderId: number): Promise<string> {
        const tab = await chrome.tabs.get(senderId);
        if (!tab.url) {
            throw new Error('Tab URL is not available');
        }
        return new URL(tab.url).hostname;
    }

    public async sendToBackground<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        message: TMessage,
    ): Promise<TResponse> {
        return chrome.runtime.sendMessage<TMessage, TResponse>(message);
    }

    public async sendToPage<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        senderId: number,
        message: TMessage,
    ): Promise<TResponse> {
        return chrome.tabs.sendMessage<TMessage, TResponse>(senderId, message);
    }

    public addMessageListener(
        handler: (message: Message) => Promise<MessageResponse> | MessageResponse | undefined,
    ): () => void {
        const listener = (
            message: Message,
            _sender: chrome.runtime.MessageSender,
            sendResponse: (response: MessageResponse) => void,
        ): boolean => {
            Promise.resolve(handler(message))
                .then((response) => {
                    if (response !== undefined) {
                        sendResponse(response);
                    }
                })
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
