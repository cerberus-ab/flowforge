import type { Message, MessageResponse } from '#self/types';
import type { TransportService } from '../interface';

export class EmbedTransportService implements TransportService {
    private readonly messageHandlers = new Set<
        (message: Message) => Promise<MessageResponse> | MessageResponse | undefined
    >();

    async getActiveSenderId(): Promise<number> {
        return 1; // not applicable
    }

    async getSenderHostname(_senderId: number): Promise<string> {
        return window.location.hostname;
    }

    async sendToBackground<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        message: TMessage,
    ): Promise<TResponse> {
        return this.send(message);
    }

    async sendToPage<TMessage extends Message, TResponse extends MessageResponse = MessageResponse>(
        _senderId: number,
        message: TMessage,
    ): Promise<TResponse> {
        return this.send(message);
    }

    addMessageListener(
        handler: (message: Message) => Promise<MessageResponse> | MessageResponse | undefined,
    ): () => void {
        this.messageHandlers.add(handler);
        return () => {
            this.messageHandlers.delete(handler);
        };
    }

    private async send<TResponse extends MessageResponse = MessageResponse>(message: Message): Promise<TResponse> {
        if (this.messageHandlers.size === 0) {
            throw new Error('Message handler is not registered');
        }
        for (const handler of this.messageHandlers) {
            const response = await handler(message);
            if (response !== undefined) {
                return response as TResponse;
            }
        }
        throw new Error('Message handler did not return a response');
    }
}
