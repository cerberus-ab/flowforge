import type { PageLifecycleClient } from '@/page/client/contract';
import { requirePageId, type MessageContext, type PopupOpenedMessage } from '@/messaging';

/**
 * Handles background work triggered by the popup lifecycle.
 * Popup initialization clears existing extension UI on the sender page without
 * making popup availability depend on the page response.
 */
export class PopupLifecycleMessageHandler {
    private readonly pageClient: PageLifecycleClient;

    constructor(pageClient: PageLifecycleClient) {
        this.pageClient = pageClient;
    }

    handlePopupOpened(_message: PopupOpenedMessage, context: MessageContext): void {
        void this.pageClient.clearPage(requirePageId(context)).catch(() => undefined);
    }
}
