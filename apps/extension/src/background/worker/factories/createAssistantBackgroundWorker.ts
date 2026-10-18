import type { ApiClient } from '@/services/ApiClient';
import type { ExtensionSettings } from '@/services/SettingsStorage';
import type { LocalStorage, SessionStorage, TransportService } from '@/adapters';
import { config } from '@/config';
import { HistoryStorage } from '@/services/HistoryStorage';
import { SettingsStorage } from '@/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';
import { PopupClient } from '@/popup/client/PopupClient';

import { PageActionMessageHandler } from '../handlers/PageActionMessageHandler';
import { PageInspectorMessageHandler } from '../handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from '../handlers/PopupLifecycleMessageHandler';
import { QueryMessageHandler } from '../handlers/QueryMessageHandler';
import { SettingsMessageHandler } from '../handlers/SettingsMessageHandler';
import { BackgroundWorker } from '../BackgroundWorker';
import { QuerySessionStorage } from '@/services/QuerySessionStorage';
import type { BackgroundMessageHandler } from '../handlers/BackgroundMessageHandler';

interface AssistantBackgroundWorkerOptions {
    transport: TransportService;
    localStorage: LocalStorage;
    sessionStorage: SessionStorage;
    apiClient: ApiClient;
    initialSettings?: Partial<ExtensionSettings>;
    pageInspectorHandler?: BackgroundMessageHandler;
}

export function createAssistantBackgroundWorker({
    transport,
    localStorage,
    sessionStorage,
    apiClient,
    initialSettings = {},
    pageInspectorHandler,
}: AssistantBackgroundWorkerOptions): BackgroundWorker {
    // dependencies
    const historyStorage = new HistoryStorage(localStorage, config.questionsHistoryLimit);
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings, initialSettings);
    const querySessionStorage = new QuerySessionStorage(sessionStorage);
    const pageClient = new PageClient(transport);
    const popupClient = new PopupClient(transport);

    // handlers
    const popupLifecycleHandler = new PopupLifecycleMessageHandler(pageClient);
    const settingsHandler = new SettingsMessageHandler(pageClient, settingsStorage);
    const inspectorHandler = pageInspectorHandler ?? new PageInspectorMessageHandler(pageClient);
    const queryHandler = new QueryMessageHandler(
        pageClient,
        popupClient,
        apiClient,
        querySessionStorage,
        historyStorage,
    );
    const pageActionHandler = new PageActionMessageHandler(pageClient);

    return new BackgroundWorker(transport, [
        popupLifecycleHandler,
        settingsHandler,
        inspectorHandler,
        queryHandler,
        pageActionHandler,
    ]);
}
