import type { TransportService } from '@/adapters';
import type {
    AnyMessageResponse,
    BackgroundMessage,
    BackgroundMessageResponse,
    Message,
    MessageListener,
    MessageResponse,
    PageMessage,
    PageMessageResponse,
    PageScopedMessage,
} from '@/messaging';

export class FakeTransportService implements TransportService {
    private readonly sentToBackground: Message[] = [];
    private readonly sentToPage: { pageId: number; message: Message }[] = [];
    private readonly handlers = new Set<MessageListener>();
    private readonly pageResponses = new Map<string, AnyMessageResponse>();

    private readonly activePageId;
    private readonly pageHostname;

    constructor({ activePageId, pageHostname }: { activePageId?: number; pageHostname?: string } = {}) {
        this.activePageId = activePageId ?? 1;
        this.pageHostname = pageHostname ?? 'localhost';
    }

    async getActivePageId(): Promise<number> {
        return this.activePageId;
    }

    async getPageHostname(): Promise<string> {
        return this.pageHostname;
    }

    async sendToBackground<M extends BackgroundMessage>(
        message: PageScopedMessage<M>,
    ): Promise<BackgroundMessageResponse<M>> {
        this.sentToBackground.push(message);
        return this.dispatchToBackground<PageScopedMessage<M>, BackgroundMessageResponse<M>>(message);
    }

    async sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponse<M>> {
        this.sentToPage.push({ pageId, message });
        return (this.pageResponses.get(message.type) ?? { success: true }) as PageMessageResponse<M>;
    }

    addMessageListener(handler: MessageListener): () => void {
        this.handlers.add(handler);
        return () => {
            this.handlers.delete(handler);
        };
    }

    getSentToPage(): readonly { pageId: number; message: Message }[] {
        return this.sentToPage;
    }

    setPageResponse(messageType: PageMessage['type'], response: AnyMessageResponse): void {
        this.pageResponses.set(messageType, response);
    }

    async dispatchToBackground<M extends Message | Message<unknown>, R extends AnyMessageResponse = MessageResponse>(
        message: M,
    ): Promise<R> {
        if (this.handlers.size === 0) {
            throw new Error('Message handler is not registered');
        }
        for (const handler of this.handlers) {
            const response = await handler(message);
            if (response !== undefined) {
                return response as R;
            }
        }
        throw new Error('Message handler did not return a response');
    }
}
