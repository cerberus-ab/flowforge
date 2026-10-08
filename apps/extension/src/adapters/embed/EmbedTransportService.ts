import type { Message, Response, TransportService } from '@/adapters';

export class EmbedTransportService implements TransportService {
    private readonly messageHandlers = new Set<(message: Message) => Promise<Response> | Response | undefined>();

    async getActivePageId(): Promise<number> {
        return 1; // not applicable
    }

    async getPageHostname(): Promise<string> {
        return window.location.hostname;
    }

    async sendToBackground<M extends Message, R extends Response = Response>(message: M): Promise<R> {
        return this.send(message);
    }

    async sendToPage<M extends Message, R extends Response = Response>(_pageId: number, message: M): Promise<R> {
        return this.send(message);
    }

    addMessageListener<R extends Response = Response>(
        handler: (message: Message) => Promise<R> | R | undefined,
    ): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    private async send<R extends Response = Response>(message: Message): Promise<R> {
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
