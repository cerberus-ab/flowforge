import type { Message, TransportService } from '@/adapters';
import { isOpenPageInspectorMessage, type OpenInspectorMessage, type OpenPageInspectorMessage } from '@/types';

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

    resolve(message: Message): (() => Promise<void>) | undefined {
        if (!isOpenPageInspectorMessage(message)) return undefined;
        return () => this.handleOpenPageInspector(message);
    }

    private async handleOpenPageInspector(message: OpenPageInspectorMessage): Promise<void> {
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
