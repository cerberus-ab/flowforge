import type { LocalStorage, TransportService } from '@/adapters';
import { config } from '@/config';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';
import {
    isGetSettingsMessage,
    isOpenPageInspectorMessage,
    isPopupOpenedMessage,
    isUpdateSettingsMessage,
} from '@/messaging';

import { BackgroundWorker } from '../BackgroundWorker';
import { PageInspectorMessageHandler } from '../handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from '../handlers/PopupLifecycleMessageHandler';
import { SettingsMessageHandler } from '../handlers/SettingsMessageHandler';
import { MessageRouter } from '@/messaging';

export interface InspectorBackgroundWorkerOptions {
    transport: TransportService;
    localStorage: LocalStorage;
}

export function createInspectorBackgroundWorker({
    transport,
    localStorage,
}: InspectorBackgroundWorkerOptions): BackgroundWorker {
    // dependencies
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);
    const pageClient = new PageClient(transport);

    // handlers
    const popupLifecycleHandler = new PopupLifecycleMessageHandler(pageClient);
    const settingsHandler = new SettingsMessageHandler(pageClient, settingsStorage);
    const pageInspectorHandler = new PageInspectorMessageHandler(pageClient);

    return new BackgroundWorker(transport, [
        MessageRouter.route(isPopupOpenedMessage, (message, context) =>
            popupLifecycleHandler.handlePopupOpened(message, context),
        ),
        MessageRouter.route(isGetSettingsMessage, () => settingsHandler.handleGetSettings()),
        MessageRouter.route(isUpdateSettingsMessage, (message, context) =>
            settingsHandler.handleUpdateSettings(message, context),
        ),
        MessageRouter.route(isOpenPageInspectorMessage, (message, context) =>
            pageInspectorHandler.handleOpenPageInspector(message, context),
        ),
    ]);
}
