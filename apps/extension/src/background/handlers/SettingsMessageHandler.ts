import type { Message, TransportService } from '@/adapters';
import type { SettingsStorage } from '@/core/services/SettingsStorage';
import {
    type ExtensionSettings,
    isGetSettingsMessage,
    isUpdateSettingsMessage,
    type SettingsUpdatedMessage,
    type UpdateSettingsMessage,
} from '@/types';

import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles persistent extension settings.
 * It reads and updates SettingsStorage and broadcasts changed settings to the
 * sender page when a page context is available.
 */
export class SettingsMessageHandler implements BackgroundMessageHandler {
    private readonly transport: TransportService;
    private readonly settingsStorage: SettingsStorage;

    constructor(transport: TransportService, settingsStorage: SettingsStorage) {
        this.transport = transport;
        this.settingsStorage = settingsStorage;
    }

    resolve(message: Message): (() => Promise<ExtensionSettings>) | undefined {
        if (isGetSettingsMessage(message)) return () => this.handleGetSettings();
        if (isUpdateSettingsMessage(message)) return () => this.handleUpdateSettings(message);
        return undefined;
    }

    private handleGetSettings(): Promise<ExtensionSettings> {
        return this.settingsStorage.get();
    }

    private async handleUpdateSettings(message: UpdateSettingsMessage): Promise<ExtensionSettings> {
        const updatedSettings = await this.settingsStorage.update(message.data.patch);
        if (message.pageId !== undefined) {
            const settingsUpdatedMessage: SettingsUpdatedMessage = {
                type: 'SETTINGS_UPDATED',
                data: updatedSettings,
            };
            void this.transport.sendToPage(message.pageId, settingsUpdatedMessage).catch(() => undefined);
        }
        return updatedSettings;
    }
}
