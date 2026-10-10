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

export class EmbedTransportService implements TransportService {
    private readonly messageHandlers = new Set<MessageListener>();

    async getActivePageId(): Promise<number> {
        return 1; // not applicable
    }

    async getPageHostname(): Promise<string> {
        return window.location.hostname;
    }

    async sendToBackground<M extends BackgroundMessage>(
        message: PageScopedMessage<M>,
    ): Promise<BackgroundMessageResponse<M>> {
        return this.send<BackgroundMessageResponse<M>>(message);
    }

    async sendToPage<M extends PageMessage>(_pageId: number, message: M): Promise<PageMessageResponse<M>> {
        return this.send<PageMessageResponse<M>>(message);
    }

    addMessageListener(handler: MessageListener): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    private async send<R extends AnyMessageResponse>(message: Message): Promise<R> {
        if (this.messageHandlers.size === 0) {
            throw new Error('Message handler is not registered');
        }
        for (const handler of this.messageHandlers) {
            const response = await handler(message);
            if (response !== undefined) {
                return response as R;
            }
        }
        throw new Error('Message handler did not return a response');
    }
}
