import { config } from '@/config';
import { HttpApiClient } from '@/services/ApiClient';
import { ChromeLocalStorage, ChromeTransportService, withTransportLogging } from '@/adapters';
import { createAssistantBackgroundWorker } from '@/background';
import { ChromeSessionStorage } from '@/adapters/chrome/ChromeSessionStorage';
import { SidePanelClient } from '@/sidePanel/client/SidePanelClient';
import { SidePanelMessageHandler } from '@/background/worker/handlers/SidePanelMessageHandler';
import { PageClient } from '@/page/client/PageClient';

const SIDE_PANEL_PATH = 'sidePanel/index.html';

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const apiClient = new HttpApiClient(config.serverUrl);
    const localStorage = new ChromeLocalStorage();
    const sessionStorage = new ChromeSessionStorage();

    const sidePanelHandler = new SidePanelMessageHandler(
        new SidePanelClient(SIDE_PANEL_PATH, transport),
        new PageClient(transport),
    );
    const backgroundWorker = createAssistantBackgroundWorker({
        transport,
        localStorage,
        sessionStorage,
        apiClient,
        inspectorHandler: sidePanelHandler,
    });
    backgroundWorker.start();
})();
