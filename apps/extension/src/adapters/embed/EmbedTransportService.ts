import type { TransportService } from '@/adapters';
import type {
    AnyMessageResponse,
    BackgroundMessage,
    BackgroundMessageResponse,
    Message,
    MessageContext,
    MessageListener,
    PageMessage,
    PageMessageResponse,
    PopupMessage,
    PopupMessageResponse,
    SidePanelMessage,
    SidePanelMessageResponse,
} from '@/messaging';

export class EmbedTransportService implements TransportService {
    private readonly messageHandlers = new Set<MessageListener>();

    async getActivePageContext(): Promise<MessageContext> {
        return { pageId: 1 }; // virtual page used by the embedded runtime
    }

    async getPageUrl(): Promise<string> {
        return window.location.href;
    }

    async sendToBackground<M extends BackgroundMessage>(
        message: M,
        context: MessageContext,
    ): Promise<BackgroundMessageResponse<M>> {
        return this.send<BackgroundMessageResponse<M>>(message, context);
    }

    async sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponse<M>> {
        return this.send<PageMessageResponse<M>>(message, { pageId });
    }

    async sendToPopup<M extends PopupMessage>(message: M, context: MessageContext): Promise<PopupMessageResponse<M>> {
        const responses = await Promise.all([...this.messageHandlers].map((handler) => handler(message, context)));
        const response = responses.find((candidate) => candidate !== undefined);
        if (response === undefined) {
            throw new Error('Message handler did not return a response');
        }
        return response as PopupMessageResponse<M>;
    }

    async sendToSidePanel<M extends SidePanelMessage>(
        message: M,
        context: MessageContext,
    ): Promise<SidePanelMessageResponse<M>> {
        return this.send<SidePanelMessageResponse<M>>(message, context);
    }

    addMessageListener(handler: MessageListener): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    private async send<R extends AnyMessageResponse>(message: Message, context: MessageContext): Promise<R> {
        if (this.messageHandlers.size === 0) {
            throw new Error('Message handler is not registered');
        }
        for (const handler of this.messageHandlers) {
            const response = await handler(message, context);
            if (response !== undefined) {
                return response as R;
            }
        }
        throw new Error('Message handler did not return a response');
    }
}
