import type { LocalStorage, TransportService } from '@/adapters';
import { config } from '@/config';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import {
    isGetSettingsMessage,
    isOpenPageInspectorMessage,
    isPopupInitializeMessage,
    isUpdateSettingsMessage,
} from '@/types';

import { BackgroundWorker } from './BackgroundWorker';
import { PageInspectorMessageHandler } from './handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from './handlers/PopupLifecycleMessageHandler';
import { SettingsMessageHandler } from './handlers/SettingsMessageHandler';
import { MessageRouter } from './MessageRouter';

interface InspectorBackgroundWorkerOptions {
    transport: TransportService;
    localStorage: LocalStorage;
}

export function createInspectorBackgroundWorker({
    transport,
    localStorage,
}: InspectorBackgroundWorkerOptions): BackgroundWorker {
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);
    const popupLifecycleHandler = new PopupLifecycleMessageHandler(transport);
    const settingsHandler = new SettingsMessageHandler(transport, settingsStorage);
    const pageInspectorHandler = new PageInspectorMessageHandler(transport);

    return new BackgroundWorker(transport, [
        MessageRouter.route(isPopupInitializeMessage, (message) => popupLifecycleHandler.handle(message)),
        MessageRouter.route(isGetSettingsMessage, () => settingsHandler.handleGetSettings()),
        MessageRouter.route(isUpdateSettingsMessage, (message) => settingsHandler.handleUpdateSettings(message)),
        MessageRouter.route(isOpenPageInspectorMessage, (message) => pageInspectorHandler.handle(message)),
    ]);
}
