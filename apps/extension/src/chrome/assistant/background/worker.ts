import { config } from '@/config';
import { HttpApiClient } from '@/core/services/ApiClient';
import { ChromeLocalStorage, ChromeTransportService } from '@/adapters';
import { createAssistantBackgroundWorker } from '@/background';

(function main() {
    const transport = new ChromeTransportService();
    const apiClient = new HttpApiClient(config.serverUrl);
    const localStorage = new ChromeLocalStorage();

    const backgroundWorker = createAssistantBackgroundWorker({ transport, localStorage, apiClient });
    backgroundWorker.start();
})();
