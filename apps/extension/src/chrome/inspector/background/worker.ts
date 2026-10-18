import { ChromeLocalStorage, ChromeTransportService, withTransportLogging } from '@/adapters';
import { createInspectorBackgroundWorker } from '@/background';
import { SidePanelClient } from '@/sidePanel/client/SidePanelClient';

const SIDE_PANEL_PATH = 'sidePanel/index.html';

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const localStorage = new ChromeLocalStorage();

    const sidePanelClient = new SidePanelClient(SIDE_PANEL_PATH, transport);
    const backgroundWorker = createInspectorBackgroundWorker({ transport, localStorage, sidePanelClient });
    backgroundWorker.start();
})();
