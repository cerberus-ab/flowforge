import { config } from '#self/config';
import { ApiClient } from '#self/core/services/ApiClient';
import { HistoryStorage } from '#self/core/services/HistoryStorage';
import { ChromeTransportService } from '#self/adapters/chrome/ChromeTransportService';
import { ChromeLocalStorage } from '#self/adapters/chrome/ChromeLocalStorage';
import { BackgroundWorker } from '#self/background/BackgroundWorker';
import { SettingsStorage } from '#self/core/services/SettignsStorage';

(function main() {
    const transport = new ChromeTransportService();
    const apiClient = new ApiClient(config.serverUrl);
    const localStorage = new ChromeLocalStorage();
    const historyStorage = new HistoryStorage(localStorage, config.questionsHistoryLimit);
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);

    const backgroundWorker = new BackgroundWorker(transport, apiClient, historyStorage, settingsStorage);
    backgroundWorker.start();
})();
