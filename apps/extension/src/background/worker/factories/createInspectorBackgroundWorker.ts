import type { LocalStorage, TransportService } from '@/adapters';
import { config } from '@/config';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';
import { BackgroundWorker } from '../BackgroundWorker';
import { PageInspectorMessageHandler } from '../handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from '../handlers/PopupLifecycleMessageHandler';
import { SettingsMessageHandler } from '../handlers/SettingsMessageHandler';

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

    return new BackgroundWorker(transport, [popupLifecycleHandler, settingsHandler, pageInspectorHandler]);
}
