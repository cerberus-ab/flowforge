import type { TransportService } from '@/adapters/interface';
import {
    type ClearPageMessage,
    isOpenPageInspectorMessage,
    type Message,
    type MessageResponse,
    type OpenInspectorMessage,
    type OpenPageInspectorMessage,
} from '@/types';

import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles requests to open the shared PageTrail Inspector on the sender page.
 * It clears existing extension UI before forwarding the requested Inspector tab
 * through the page transport.
 */
export class PageInspectorMessageHandler implements BackgroundMessageHandler {
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    /** Routes supported Inspector messages to their operations. */
    handle(message: Message): Promise<MessageResponse> | undefined {
        if (isOpenPageInspectorMessage(message)) return this.handleOpenPageInspector(message);
        return undefined;
    }

    /** Clears the page state and opens the requested Inspector tab. */
    private async handleOpenPageInspector(message: OpenPageInspectorMessage): Promise<MessageResponse> {
        await this.transport.sendToPage<ClearPageMessage>(message.senderId, {
            type: 'CLEAR_PAGE',
        });
        await this.transport.sendToPage<OpenInspectorMessage>(message.senderId, {
            type: 'OPEN_INSPECTOR',
            data: message.data,
        });
        return { success: true };
    }
}
