import type { TransportService } from '@/adapters';

import { MessageRouter } from '@/messaging';
import type { BackgroundMessageHandler } from './handlers/BackgroundMessageHandler';

export class BackgroundWorker {
    private readonly transport: TransportService;
    private readonly router: MessageRouter;
    private unsubscribe?: () => void;

    constructor(transport: TransportService, handlers: readonly BackgroundMessageHandler[]) {
        this.transport = transport;
        const routes = handlers.flatMap((handler) => handler.routes());
        this.router = new MessageRouter(routes, (message, _context, error) => {
            console.error(`[FlowForge] Background failed to handle ${message.type}:`, error);
        });
    }

    start(): void {
        this.unsubscribe = this.transport.addMessageListener(this.router.handle);
        console.log('[FlowForge] Background worker started');
    }

    stop(): void {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
        console.log('[FlowForge] Background worker stopped');
    }
}
