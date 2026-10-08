import type { Message, TransportService } from '@/adapters';
import type { SettingsStorage } from '@/core/services/SettingsStorage';
import {
    type GetSettingsMessageResponse,
    isGetSettingsMessage,
    isUpdateSettingsMessage,
    type SettingsUpdatedMessage,
    type UpdateSettingsMessage,
    type UpdateSettingsMessageResponse,
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

    /** Routes supported settings messages to their operations. */
    handle(message: Message): Promise<GetSettingsMessageResponse | UpdateSettingsMessageResponse> | undefined {
        if (isGetSettingsMessage(message)) return this.handleGetSettings();
        if (isUpdateSettingsMessage(message)) return this.handleUpdateSettings(message);
        return undefined;
    }

    /** Returns the current extension settings. */
    private async handleGetSettings(): Promise<GetSettingsMessageResponse> {
        const settings = await this.settingsStorage.get();
        return { success: true, data: settings };
    }

    /** Persists a settings patch and broadcasts the updated settings. */
    private async handleUpdateSettings(message: UpdateSettingsMessage): Promise<UpdateSettingsMessageResponse> {
        const updatedSettings = await this.settingsStorage.update(message.data.patch);
        if (message.pageId !== undefined) {
            const settingsUpdatedMessage: SettingsUpdatedMessage = {
                type: 'SETTINGS_UPDATED',
                data: updatedSettings,
            };
            void this.transport.sendToPage(message.pageId, settingsUpdatedMessage).catch(() => undefined);
        }
        return { success: true, data: updatedSettings };
    }
}
