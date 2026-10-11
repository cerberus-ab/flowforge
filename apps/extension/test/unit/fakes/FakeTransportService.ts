import type { TransportService } from '@/adapters';
import type {
    AnyMessageResponse,
    BackgroundMessage,
    BackgroundMessageResponse,
    Message,
    MessageContext,
    MessageListener,
    MessageResponse,
    PageMessage,
    PageMessageResponse,
    PopupMessage,
    PopupMessageResponse,
} from '@/messaging';

export class FakeTransportService implements TransportService {
    private readonly sentToBackground: Message[] = [];
    private readonly sentToPage: { pageId: number; message: Message }[] = [];
    private readonly sentToPopup: { message: PopupMessage }[] = [];
    private readonly handlers = new Set<MessageListener>();
    private readonly pageResponses = new Map<string, AnyMessageResponse>();

    private readonly activePageId;
    private readonly pageUrl;

    constructor({ activePageId, pageUrl }: { activePageId?: number; pageUrl?: string } = {}) {
        this.activePageId = activePageId ?? 1;
        this.pageUrl = pageUrl ?? 'http://localhost/';
    }

    async getActivePageContext(): Promise<MessageContext> {
        return { pageId: this.activePageId };
    }

    async getPageUrl(): Promise<string> {
        return this.pageUrl;
    }

    async sendToBackground<M extends BackgroundMessage>(
        message: M,
        context: MessageContext,
    ): Promise<BackgroundMessageResponse<M>> {
        this.sentToBackground.push(message);
        return this.dispatchToBackground<M, BackgroundMessageResponse<M>>(message, context);
    }

    async sendToPage<M extends PageMessage>(pageId: number, message: M): Promise<PageMessageResponse<M>> {
        this.sentToPage.push({ pageId, message });
        return (this.pageResponses.get(message.type) ?? { success: true }) as PageMessageResponse<M>;
    }

    async sendToPopup<M extends PopupMessage>(message: M): Promise<PopupMessageResponse<M>> {
        this.sentToPopup.push({ message });
        const responses = await Promise.all([...this.handlers].map((handler) => handler(message, {})));
        return (responses.find((response) => response !== undefined) ?? { success: true }) as PopupMessageResponse<M>;
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

    getSentToPopup(): readonly { message: PopupMessage }[] {
        return this.sentToPopup;
    }

    setPageResponse(messageType: PageMessage['type'], response: AnyMessageResponse): void {
        this.pageResponses.set(messageType, response);
    }

    async dispatchToBackground<M extends Message | Message<unknown>, R extends AnyMessageResponse = MessageResponse>(
        message: M,
        context: MessageContext = {},
    ): Promise<R> {
        if (this.handlers.size === 0) {
            throw new Error('Message handler is not registered');
        }
        for (const handler of this.handlers) {
            const response = await handler(message, context);
            if (response !== undefined) {
                return response as R;
            }
        }
        throw new Error('Message handler did not return a response');
    }
}
