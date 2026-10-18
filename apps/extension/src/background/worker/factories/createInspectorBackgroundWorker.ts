import type { Storage, TransportService } from '@/adapters';
import { config } from '@/config';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';
import { ChromeSidePanelClient } from '@/chrome/inspector/background/SidePanelClient';
import { InspectorSidePanelMessageHandler } from '@/chrome/inspector/background/InspectorSidePanelMessageHandler';
import { INSPECTOR_SIDE_PANEL_PATH } from '@/chrome/inspector/constants';
import { BackgroundWorker } from '../BackgroundWorker';
import { SettingsMessageHandler } from '../handlers/SettingsMessageHandler';

export interface InspectorBackgroundWorkerOptions {
    transport: TransportService;
    localStorage: Storage;
}

export function createInspectorBackgroundWorker({
    transport,
    localStorage,
}: InspectorBackgroundWorkerOptions): BackgroundWorker {
    // dependencies
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);
    const pageClient = new PageClient(transport);

    // handlers
    const settingsHandler = new SettingsMessageHandler(pageClient, settingsStorage);
    const sidePanelHandler = new InspectorSidePanelMessageHandler(
        new ChromeSidePanelClient(INSPECTOR_SIDE_PANEL_PATH, transport),
        pageClient,
    );

    return new BackgroundWorker(transport, [settingsHandler, sidePanelHandler]);
}
