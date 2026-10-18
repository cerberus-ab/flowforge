import type { Storage, TransportService } from '@/adapters';
import { config } from '@/config';
import { SettingsStorage } from '@/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';
import type { SidePanelInspectorClient } from '@/sidePanel/client/contract';
import { SidePanelMessageHandler } from '../handlers/SidePanelMessageHandler';
import { BackgroundWorker } from '../BackgroundWorker';
import { SettingsMessageHandler } from '../handlers/SettingsMessageHandler';

export interface InspectorBackgroundWorkerOptions {
    transport: TransportService;
    localStorage: Storage;
    sidePanelClient: SidePanelInspectorClient;
}

export function createInspectorBackgroundWorker({
    transport,
    localStorage,
    sidePanelClient,
}: InspectorBackgroundWorkerOptions): BackgroundWorker {
    // dependencies
    const settingsStorage = new SettingsStorage(localStorage, config.defaultSettings);
    const pageClient = new PageClient(transport);

    // handlers
    const settingsHandler = new SettingsMessageHandler(pageClient, settingsStorage);
    const sidePanelHandler = new SidePanelMessageHandler(sidePanelClient, pageClient);

    return new BackgroundWorker(transport, [settingsHandler, sidePanelHandler]);
}
