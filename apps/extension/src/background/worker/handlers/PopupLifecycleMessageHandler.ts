import type { PageLifecycleClient } from '@/page/client/contract';
import type { PopupInitializeMessage } from '@/types';

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

    handlePopupInitialize(message: PopupInitializeMessage): void {
        void this.pageClient.clearPage(message.pageId).catch(() => undefined);
    }
}
