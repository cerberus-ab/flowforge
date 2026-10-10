import type { LocalStorage, TransportService } from '@/adapters';
import { config } from '@/config';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';
import {
    isGetSettingsMessage,
    isOpenPageInspectorMessage,
    isPopupInitializeMessage,
    isUpdateSettingsMessage,
} from '@/types';

import { BackgroundWorker } from '../BackgroundWorker';
import { PageInspectorMessageHandler } from '@/background/worker/handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from '@/background/worker/handlers/PopupLifecycleMessageHandler';
import { SettingsMessageHandler } from '@/background/worker/handlers/SettingsMessageHandler';
import { MessageRouter } from '../../MessageRouter';

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
        MessageRouter.route(isPopupInitializeMessage, (message) =>
            popupLifecycleHandler.handlePopupInitialize(message),
        ),
        MessageRouter.route(isGetSettingsMessage, () => settingsHandler.handleGetSettings()),
        MessageRouter.route(isUpdateSettingsMessage, (message) => settingsHandler.handleUpdateSettings(message)),
        MessageRouter.route(isOpenPageInspectorMessage, (message) =>
            pageInspectorHandler.handleOpenPageInspector(message),
        ),
    ]);
}
