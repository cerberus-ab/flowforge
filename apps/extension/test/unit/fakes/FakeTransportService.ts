import type { Message, Response, TransportService } from '@/adapters';

type Handler = (message: Message) => Promise<Response> | Response | undefined;

export class FakeTransportService implements TransportService {
    private readonly sentToBackground: Message[] = [];
    private readonly sentToPage: { pageId: number; message: Message }[] = [];
    private readonly handlers = new Set<Handler>();
    private readonly pageResponses = new Map<string, Response<unknown>>();

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

    async sendToBackground<M extends Message, R extends Response = Response>(message: M): Promise<R> {
        this.sentToBackground.push(message);
        return this.dispatchToBackground<M, R>(message);
    }

    async sendToPage<M extends Message, R extends Response = Response>(pageId: number, message: M): Promise<R> {
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

    setPageResponse(messageType: Message['type'], response: Response<unknown>): void {
        this.pageResponses.set(messageType, response);
    }

    async dispatchToBackground<M extends Message, R extends Response = Response>(message: M): Promise<R> {
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
