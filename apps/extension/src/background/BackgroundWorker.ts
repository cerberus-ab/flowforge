import type { TransportService } from '@/adapters';

import type { BackgroundMessageHandler } from './handlers/BackgroundMessageHandler';
import { MessageRouter } from './MessageRouter';

/**
 * Routes incoming background messages through an ordered collection of handlers.
 * The first matching handler owns the message. The shared router converts handler
 * results and failures into transport responses.
 */
export class BackgroundWorker {
    private readonly transport: TransportService;
    private readonly router: MessageRouter;
    private unsubscribe?: () => void;

    constructor(transport: TransportService, handlers: readonly BackgroundMessageHandler[]) {
        this.transport = transport;
        this.router = new MessageRouter(handlers, (message, error) => {
            console.error(`[FlowForge] Background failed to handle ${message.type}:`, error);
        });
    }

    start(): void {
        this.unsubscribe = this.transport.addMessageListener(this.router.handle);
        console.log('[FlowForge] Background worker loaded and started');
    }

    stop(): void {
        this.unsubscribe?.();
        console.log('[FlowForge] Background worker stopped');
    }
}
