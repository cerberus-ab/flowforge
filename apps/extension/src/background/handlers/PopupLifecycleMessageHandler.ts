import type { TransportService } from '@/adapters/interface';
import {
    type ClearPageMessage,
    isPopupInitializeMessage,
    type Message,
    type MessageResponse,
    type PopupInitializeMessage,
} from '@/types';

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

    /** Routes supported popup lifecycle messages to their operations. */
    handle(message: Message): MessageResponse | undefined {
        if (isPopupInitializeMessage(message)) return this.handlePopupInitialize(message);
        return undefined;
    }

    /** Clears existing page UI when the popup initializes. */
    private handlePopupInitialize(message: PopupInitializeMessage): MessageResponse {
        void this.transport
            .sendToPage<ClearPageMessage>(message.senderId, {
                type: 'CLEAR_PAGE',
            })
            .catch(() => undefined);
        return { success: true };
    }
}
