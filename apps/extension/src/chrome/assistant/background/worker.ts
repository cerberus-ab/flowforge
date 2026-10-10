import { config } from '@/config';
import { HttpApiClient } from '@/core/services/ApiClient';
import { ChromeLocalStorage, ChromeTransportService } from '@/adapters';
import { createBackgroundWorker } from '@/background/worker/factories/createBackgroundWorker';

(function main() {
    const transport = new ChromeTransportService();
    const apiClient = new HttpApiClient(config.serverUrl);
    const localStorage = new ChromeLocalStorage();

    const backgroundWorker = createBackgroundWorker({ transport, localStorage, apiClient });
    backgroundWorker.start();
})();
