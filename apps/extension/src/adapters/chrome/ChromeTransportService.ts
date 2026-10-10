import type { TransportService } from '@/adapters';
import type {
    AnyMessageResponse,
    BackgroundMessage,
    BackgroundMessageResponse,
    MessageContext,
    MessageEnvelope,
    MessageListener,
    PageMessage,
    PageMessageResponse,
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
    public async getActivePageContext(): Promise<MessageContext> {
        if (!chrome.tabs?.query) return {};

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id === undefined) {
            return {};
        }
        return { pageId: tab.id };
    }

    public async getPageUrl(pageId: number): Promise<string> {
        const tab = await chrome.tabs.get(pageId);
        if (!tab.url) {
            throw new Error('Tab URL is not available');
        }
        return tab.url;
    }

    public async sendToBackground<M extends BackgroundMessage>(
        message: M,
        context: MessageContext,
    ): Promise<BackgroundMessageResponse<M>> {
        const envelope: MessageEnvelope<M> = { message, context };
        return chrome.runtime.sendMessage<MessageEnvelope<M>, BackgroundMessageResponse<M>>(envelope);
    }

    public async sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponse<M>> {
        const envelope: MessageEnvelope<M> = { message, context: { pageId } };
        return chrome.tabs.sendMessage<MessageEnvelope<M>, PageMessageResponse<M>>(pageId, envelope);
    }

    public addMessageListener(handler: MessageListener): () => void {
        const listener = (
            envelope: MessageEnvelope,
            sender: chrome.runtime.MessageSender,
            sendResponse: (response: AnyMessageResponse) => void,
        ): boolean => {
            const senderIsExtensionPage = sender.url?.startsWith(chrome.runtime.getURL('/')) ?? false;
            const context: MessageContext = {
                ...envelope.context,
                pageId: senderIsExtensionPage ? envelope.context.pageId : (sender.tab?.id ?? envelope.context.pageId),
            };
            const response = handler(envelope.message, context);

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
