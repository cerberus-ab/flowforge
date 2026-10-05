import type { TransportService } from '@/adapters/interface';
import type { Message, MessageResponse } from '@/types';

import type { BackgroundMessageHandler } from './handlers/BackgroundMessageHandler';

/**
 * Routes incoming background messages through an ordered collection of handlers.
 * The first handler that returns a response owns the message. The worker manages
 * the transport listener lifecycle and converts synchronous or asynchronous
 * handler failures into unsuccessful message responses.
 */
export class BackgroundWorker {
    private readonly transport: TransportService;
    private readonly handlers: readonly BackgroundMessageHandler[];
    private unsubscribe?: () => void;

    constructor(transport: TransportService, handlers: readonly BackgroundMessageHandler[]) {
        this.transport = transport;
        this.handlers = handlers;
    }

    start(): void {
        this.unsubscribe = this.transport.addMessageListener((message) => this.handleMessage(message));
        console.log('[FlowForge] Background worker loaded and started');
    }

    stop(): void {
        this.unsubscribe?.();
        console.log('[FlowForge] Background worker stopped');
    }

    /** Routes a message to the first handler that supports it. */
    private handleMessage(message: Message): Promise<MessageResponse> | MessageResponse | undefined {
        try {
            for (const handler of this.handlers) {
                const response = handler.handle(message);
                if (response !== undefined) {
                    return Promise.resolve(response).catch((error: unknown) => this.handleError(message, error));
                }
            }
        } catch (error) {
            return this.handleError(message, error);
        }
        return undefined;
    }

    /** Logs a handler failure and converts it to a message response. */
    private handleError(message: Message, error: unknown): MessageResponse {
        console.error(`[FlowForge] Background failed to handle ${message.type}:`, error);

        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}
