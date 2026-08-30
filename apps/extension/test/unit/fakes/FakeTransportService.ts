import type { Message, MessageResponse } from '@/types';
import type { TransportService } from '@/adapters/interface.ts';

type Handler = (message: Message) => Promise<MessageResponse> | MessageResponse | undefined;

export class FakeTransportService implements TransportService {
    private readonly sentToBackground: Message[] = [];
    private readonly sentToPage: { senderId: number; message: Message }[] = [];
    private readonly handlers = new Set<Handler>();
    private readonly pageResponses = new Map<string, MessageResponse<unknown>>();

    private readonly activeSenderId;
    private readonly senderHostname;

    constructor({ activeSenderId, senderHostname }: { activeSenderId?: number; senderHostname?: string } = {}) {
        this.activeSenderId = activeSenderId ?? 1;
        this.senderHostname = senderHostname ?? 'localhost';
    }

    async getActiveSenderId(): Promise<number> {
        return this.activeSenderId;
    }

    async getSenderHostname(): Promise<string> {
        return this.senderHostname;
    }

    async sendToBackground<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        message: TMessage,
    ): Promise<TResponse> {
        this.sentToBackground.push(message);
        return this.dispatchToBackground<TMessage, TResponse>(message);
    }

    async sendToPage<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        senderId: number,
        message: TMessage,
    ): Promise<TResponse> {
        this.sentToPage.push({ senderId, message });
        return (this.pageResponses.get(message.type) ?? { success: true }) as TResponse;
    }

    addMessageListener(handler: Handler): () => void {
        this.handlers.add(handler);
        return () => {
            this.handlers.delete(handler);
        };
    }

    getSentToPage(): readonly { senderId: number; message: Message }[] {
        return this.sentToPage;
    }

    setPageResponse(messageType: Message['type'], response: MessageResponse<unknown>): void {
        this.pageResponses.set(messageType, response);
    }

    async dispatchToBackground<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        message: TMessage,
    ): Promise<TResponse> {
        if (this.handlers.size === 0) {
            throw new Error('Message handler is not registered');
        }
        for (const handler of this.handlers) {
            const response = await handler(message);
            if (response !== undefined) {
                return response as TResponse;
            }
        }
        throw new Error('Message handler did not return a response');
    }
}
