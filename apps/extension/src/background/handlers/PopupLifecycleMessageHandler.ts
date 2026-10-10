import type { TransportService } from '@/adapters';
import type { PopupInitializeMessage } from '@/types';

/**
 * Handles background work triggered by the popup lifecycle.
 * Popup initialization clears existing extension UI on the sender page without
 * making popup availability depend on the page response.
 */
export class PopupLifecycleMessageHandler {
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    handle(message: PopupInitializeMessage): void {
        void this.transport
            .sendToPage(message.pageId, {
                type: 'CLEAR_PAGE',
            })
            .catch(() => undefined);
    }
}
