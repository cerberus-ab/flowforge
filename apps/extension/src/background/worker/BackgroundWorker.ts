import type { TransportService } from '@/adapters';

import { MessageRouter, type MessageRoute } from '@/messaging';

export class BackgroundWorker {
    private readonly transport: TransportService;
    private readonly router: MessageRouter;
    private unsubscribe?: () => void;

    constructor(transport: TransportService, routes: readonly MessageRoute[]) {
        this.transport = transport;
        this.router = new MessageRouter(routes, (message, error) => {
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
