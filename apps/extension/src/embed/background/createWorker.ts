import { config } from '@/config';
import { BackgroundWorker } from '@/background/BackgroundWorker';
import { EmbedLocalStorage } from '@/adapters/embed/EmbedLocalStorage';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import type { ExtensionSettings } from '@/types';
import { PopupLifecycleMessageHandler } from '@/background/handlers/PopupLifecycleMessageHandler';
import { SettingsMessageHandler } from '@/background/handlers/SettingsMessageHandler';
import { PageInspectorMessageHandler } from '@/background/handlers/PageInspectorMessageHandler';
import { QuestionMessageHandler } from '@/background/handlers/QuestionMessageHandler';
import { ElementNavigationMessageHandler } from '@/background/handlers/ElementNavigationMessageHandler';
import type { ApiClient } from '@/core/services/ApiClient';
import type { EmbedTransportService } from '@/adapters/embed/EmbedTransportService';

/**
 * Creates an embed background worker with storage and supported message handlers.
 * The caller is responsible for starting and stopping it.
 */
export function createEmbedBackgroundWorker(
    transport: EmbedTransportService,
    apiClient: ApiClient,
    initialSettings: Partial<ExtensionSettings> = {},
): BackgroundWorker {
    const localStorage = new EmbedLocalStorage();
    const historyStorage = new HistoryStorage(localStorage, config.questionsHistoryLimit);
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings, initialSettings);

    return new BackgroundWorker(transport, [
        new PopupLifecycleMessageHandler(transport),
        new SettingsMessageHandler(transport, settingsStorage),
        new PageInspectorMessageHandler(transport),
        new QuestionMessageHandler(transport, apiClient, historyStorage),
        new ElementNavigationMessageHandler(transport),
    ]);
}
