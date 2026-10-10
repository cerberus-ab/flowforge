import type { PageLifecycleClient } from '@/page/client/contract';
import {
    MessageRouter,
    isPopupOpenedMessage,
    requirePageId,
    type MessageContext,
    type PopupOpenedMessage,
} from '@/messaging';
import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles messages tied to the popup lifecycle.
 * On popup initialization, asks the sender page to clear extension UI.
 * Page cleanup is best-effort and does not delay popup availability.
 */
export class PopupLifecycleMessageHandler implements BackgroundMessageHandler {
    private readonly pageClient: PageLifecycleClient;

    constructor(pageClient: PageLifecycleClient) {
        this.pageClient = pageClient;
    }

    routes() {
        return [
            MessageRouter.route(isPopupOpenedMessage, (message, context) => this.handlePopupOpened(message, context)),
        ];
    }

    /** Best-effort clears extension UI when the popup opens. */
    handlePopupOpened(_message: PopupOpenedMessage, context: MessageContext): void {
        const pageId = requirePageId(context);

        void this.pageClient.clearPage(pageId).catch(() => undefined);
    }
}
