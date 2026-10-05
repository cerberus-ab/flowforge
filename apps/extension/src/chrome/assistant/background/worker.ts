import { config } from '@/config';
import { HttpApiClient } from '@/core/services/ApiClient';
import { HistoryStorage } from '@/core/services/HistoryStorage';
import { ChromeTransportService } from '@/adapters/chrome/ChromeTransportService';
import { ChromeLocalStorage } from '@/adapters/chrome/ChromeLocalStorage';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { BackgroundWorker } from '@/background/BackgroundWorker';
import { ElementNavigationMessageHandler } from '@/background/handlers/ElementNavigationMessageHandler';
import { PageInspectorMessageHandler } from '@/background/handlers/PageInspectorMessageHandler';
import { PopupLifecycleMessageHandler } from '@/background/handlers/PopupLifecycleMessageHandler';
import { QuestionMessageHandler } from '@/background/handlers/QuestionMessageHandler';
import { SettingsMessageHandler } from '@/background/handlers/SettingsMessageHandler';

(function main() {
    const transport = new ChromeTransportService();
    const apiClient = new HttpApiClient(config.serverUrl);
    const localStorage = new ChromeLocalStorage();
    const historyStorage = new HistoryStorage(localStorage, config.questionsHistoryLimit);
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);

    const backgroundWorker = new BackgroundWorker(transport, [
        new PopupLifecycleMessageHandler(transport),
        new SettingsMessageHandler(transport, settingsStorage),
        new PageInspectorMessageHandler(transport),
        new QuestionMessageHandler(transport, apiClient, historyStorage),
        new ElementNavigationMessageHandler(transport),
    ]);
    backgroundWorker.start();
})();
