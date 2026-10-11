import { ChromeLocalStorage, ChromeTransportService, withTransportLogging } from '@/adapters';
import { createInspectorBackgroundWorker } from '@/background';

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const localStorage = new ChromeLocalStorage();

    const backgroundWorker = createInspectorBackgroundWorker({ transport, localStorage });
    backgroundWorker.start();
})();
