import type { Message, TransportService } from '@/adapters';
import { isPopupInitializeMessage, type PopupInitializeMessage } from '@/types';

import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles background work triggered by the popup lifecycle.
 * Popup initialization clears existing extension UI on the sender page without
 * making popup availability depend on the page response.
 */
export class PopupLifecycleMessageHandler implements BackgroundMessageHandler {
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    resolve(message: Message): (() => void) | undefined {
        if (!isPopupInitializeMessage(message)) return undefined;
        return () => this.handlePopupInitialize(message);
    }

    private handlePopupInitialize(message: PopupInitializeMessage): void {
        void this.transport
            .sendToPage(message.pageId, {
                type: 'CLEAR_PAGE',
            })
            .catch(() => undefined);
    }
}
