import { config } from '@/config';
import { HttpApiClient } from '@/services/ApiClient';
import { ChromeLocalStorage, ChromeTransportService, withTransportLogging } from '@/adapters';
import { createAssistantBackgroundWorker } from '@/background';
import { ChromeSessionStorage } from '@/adapters/chrome/ChromeSessionStorage';
import { ChromeSidePanelClient } from '@/chrome/sidePanel/SidePanelClient';
import { InspectorSidePanelMessageHandler } from '@/chrome/sidePanel/InspectorSidePanelMessageHandler';
import { INSPECTOR_SIDE_PANEL_PATH } from '@/chrome/sidePanel/constants';
import { PageClient } from '@/page/client/PageClient';

(function main() {
    const transport = withTransportLogging(new ChromeTransportService());
    const apiClient = new HttpApiClient(config.serverUrl);
    const localStorage = new ChromeLocalStorage();
    const sessionStorage = new ChromeSessionStorage();

    const pageInspectorHandler = new InspectorSidePanelMessageHandler(
        new ChromeSidePanelClient(INSPECTOR_SIDE_PANEL_PATH, transport),
        new PageClient(transport),
    );
    const backgroundWorker = createAssistantBackgroundWorker({
        transport,
        localStorage,
        sessionStorage,
        apiClient,
        pageInspectorHandler,
    });
    backgroundWorker.start();
})();
