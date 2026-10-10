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
import { QuestionMessageHandler } from '../handlers/QuestionMessageHandler';
import { SettingsMessageHandler } from '../handlers/SettingsMessageHandler';
import { BackgroundWorker } from '../BackgroundWorker';
import { PageSessionStorage } from '@/core/services/PageSessionStorage';

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
    const pageSessionStorage = new PageSessionStorage(sessionStorage);
    const pageClient = new PageClient(transport);

    // handlers
    const popupLifecycleHandler = new PopupLifecycleMessageHandler(pageClient);
    const settingsHandler = new SettingsMessageHandler(pageClient, settingsStorage);
    const pageInspectorHandler = new PageInspectorMessageHandler(pageClient);
    const questionHandler = new QuestionMessageHandler(pageClient, apiClient, pageSessionStorage, historyStorage);
    const pageActionHandler = new PageActionMessageHandler(pageClient);

    return new BackgroundWorker(transport, [
        popupLifecycleHandler,
        settingsHandler,
        pageInspectorHandler,
        questionHandler,
        pageActionHandler,
    ]);
}
