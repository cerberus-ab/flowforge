import { ChromeLocalStorage, ChromeTransportService } from '@/adapters';
import { createInspectorBackgroundWorker } from '@/background/createInspectorBackgroundWorker';

(function main() {
    const transport = new ChromeTransportService();
    const localStorage = new ChromeLocalStorage();

    const backgroundWorker = createInspectorBackgroundWorker({ transport, localStorage });
    backgroundWorker.start();
})();
