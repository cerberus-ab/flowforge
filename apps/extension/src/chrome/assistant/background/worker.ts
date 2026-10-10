import { config } from '@/config';
import { HttpApiClient } from '@/core/services/ApiClient';
import { ChromeLocalStorage, ChromeTransportService } from '@/adapters';
import { createAssistantBackgroundWorker } from '@/background';
import { ChromeSessionStorage } from '@/adapters/chrome/ChromeSessionStorage';

(function main() {
    const transport = new ChromeTransportService();
    const apiClient = new HttpApiClient(config.serverUrl);
    const localStorage = new ChromeLocalStorage();
    const sessionStorage = new ChromeSessionStorage();

    const backgroundWorker = createAssistantBackgroundWorker({ transport, localStorage, sessionStorage, apiClient });
    backgroundWorker.start();
})();
