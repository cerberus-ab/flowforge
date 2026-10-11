import type { ApiClient } from '@/core/services/ApiClient';
import type { ExtensionSettings } from '@/types';
import type { LocalStorage, SessionStorage, TransportService } from '@/adapters';
import { config } from '@/config';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';

import { PageActionMessageHandler } from '../handlers/PageActionMessageHandler';
import { PageInspectorMessageHandler } from '../handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from '../handlers/PopupLifecycleMessageHandler';
import { QueryMessageHandler } from '../handlers/QueryMessageHandler';
import { SettingsMessageHandler } from '../handlers/SettingsMessageHandler';
import { BackgroundWorker } from '../BackgroundWorker';
import { QuerySessionStorage } from '@/core/services/QuerySessionStorage';

interface AssistantBackgroundWorkerOptions {
    transport: TransportService;
    localStorage: LocalStorage;
    sessionStorage: SessionStorage;
    apiClient: ApiClient;
    initialSettings?: Partial<ExtensionSettings>;
}

export function createAssistantBackgroundWorker({
    transport,
    localStorage,
    sessionStorage,
    apiClient,
    initialSettings = {},
}: AssistantBackgroundWorkerOptions): BackgroundWorker {
    // dependencies
    const historyStorage = new HistoryStorage(localStorage, config.questionsHistoryLimit);
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings, initialSettings);
    const querySessionStorage = new QuerySessionStorage(sessionStorage);
    const pageClient = new PageClient(transport);

    // handlers
    const popupLifecycleHandler = new PopupLifecycleMessageHandler(pageClient);
    const settingsHandler = new SettingsMessageHandler(pageClient, settingsStorage);
    const pageInspectorHandler = new PageInspectorMessageHandler(pageClient);
    const queryHandler = new QueryMessageHandler(pageClient, apiClient, querySessionStorage, historyStorage);
    const pageActionHandler = new PageActionMessageHandler(pageClient);

    return new BackgroundWorker(transport, [
        popupLifecycleHandler,
        settingsHandler,
        pageInspectorHandler,
        queryHandler,
        pageActionHandler,
    ]);
}
