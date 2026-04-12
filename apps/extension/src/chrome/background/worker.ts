import { config } from '#self/config';
import { ApiClient } from '#self/core/services/ApiClient';
import { HistoryService } from '#self/core/services/HistoryService';
import { constants } from '#self/constants';
import { ChromeTransportService } from '#self/adapters/chrome/ChromeTransportService';
import { ChromeStorageService } from '#self/adapters/chrome/ChromeStorageService';
import { BackgroundWorker } from '#self/background/BackgroundWorker';

(function main() {
    const transport = new ChromeTransportService();
    const apiClient = new ApiClient(config.serverUrl);
    const historyService = new HistoryService(new ChromeStorageService(), {
        namespace: constants.HISTORY_STORAGE_NAMESPACE,
        limit: config.questionsHistoryLimit,
    });

    const backgroundWorker = new BackgroundWorker(transport, apiClient, historyService);
    backgroundWorker.start();
})();
