import type { PageSettingsClient } from '@/page/client/contract';
import type { SettingsStorage } from '@/core/services/SettingsStorage';
import type { UpdateSettingsMessage } from '@/messaging';
import type { ExtensionSettings } from '@/types';

/**
 * Handles persistent extension settings.
 * It reads and updates SettingsStorage and broadcasts changed settings to the
 * sender page when a page context is available.
 */
export class SettingsMessageHandler {
    private readonly pageClient: PageSettingsClient;
    private readonly settingsStorage: SettingsStorage;

    constructor(pageClient: PageSettingsClient, settingsStorage: SettingsStorage) {
        this.pageClient = pageClient;
        this.settingsStorage = settingsStorage;
    }

    handleGetSettings(): Promise<ExtensionSettings> {
        return this.settingsStorage.get();
    }

    async handleUpdateSettings(message: UpdateSettingsMessage): Promise<ExtensionSettings> {
        const updatedSettings = await this.settingsStorage.update(message.data.patch);
        if (message.pageId !== undefined) {
            void this.pageClient.notifySettingsUpdated(message.pageId, updatedSettings).catch(() => undefined);
        }
        return updatedSettings;
    }
}
