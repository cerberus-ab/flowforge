import type { Message, MessageResponse, PageMessage, TransportService } from '@/adapters';

type Handler = (message: Message) => Promise<MessageResponse> | MessageResponse | undefined;

export class FakeTransportService implements TransportService {
    private readonly sentToBackground: Message[] = [];
    private readonly sentToPage: { pageId: number; message: Message }[] = [];
    private readonly handlers = new Set<Handler>();
    private readonly pageResponses = new Map<string, MessageResponse<unknown>>();

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

    async sendToBackground<R extends MessageResponse = MessageResponse>(message: PageMessage): Promise<R> {
        this.sentToBackground.push(message);
        return this.dispatchToBackground<Message, R>(message);
    }

    async sendToPage<R extends MessageResponse = MessageResponse>(pageId: number, message: Message): Promise<R> {
        this.sentToPage.push({ pageId, message });
        return (this.pageResponses.get(message.type) ?? { success: true }) as R;
    }

    addMessageListener(handler: Handler): () => void {
        this.handlers.add(handler);
        return () => {
            this.handlers.delete(handler);
        };
    }

    getSentToPage(): readonly { pageId: number; message: Message }[] {
        return this.sentToPage;
    }

    setPageResponse(messageType: Message['type'], response: MessageResponse<unknown>): void {
        this.pageResponses.set(messageType, response);
    }

    async dispatchToBackground<M extends Message, R extends MessageResponse = MessageResponse>(message: M): Promise<R> {
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
