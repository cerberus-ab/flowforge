import type { TransportService } from '@/adapters';
import { type OpenInspectorMessage, type OpenPageInspectorMessage } from '@/types';

/**
 * Handles requests to open the shared PageTrail Inspector on the sender page.
 * It clears existing extension UI before forwarding the requested Inspector tab
 * through the page transport.
 */
export class PageInspectorMessageHandler {
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    async handle(message: OpenPageInspectorMessage): Promise<void> {
        await this.transport.sendToPage(message.pageId, {
            type: 'CLEAR_PAGE',
        });
        const openInspectorMessage: OpenInspectorMessage = {
            type: 'OPEN_INSPECTOR',
            data: message.data,
        };
        await this.transport.sendToPage(message.pageId, openInspectorMessage);
    }
}
