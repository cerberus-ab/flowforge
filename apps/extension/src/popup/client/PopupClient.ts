import type { TransportService } from '@/adapters';
import type { PopupQueryClient } from './contract';

/** Sends query-finished notifications from background to popup contexts. */
export class PopupClient implements PopupQueryClient {
    private readonly transport: TransportService;

    constructor(transport: TransportService) {
        this.transport = transport;
    }

    /** Notifies popups that a query has finished. */
    notifyQueryFinished(pageId: number, queryId: string): Promise<void> {
        return this.transport.sendToPopup(pageId, {
            type: 'QUERY_FINISHED',
            data: { queryId },
        });
    }
}
