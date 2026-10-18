import type { PageSettingsClient } from '@/page/client/contract';
import type { SettingsStorage } from '@/services/SettingsStorage';
import type { MessageContext, UpdateSettingsMessage } from '@/messaging';
import type { ExtensionSettings } from '@/services/SettingsStorage';
import { MessageRouter, isGetSettingsMessage, isUpdateSettingsMessage } from '@/messaging';
import type { BackgroundMessageHandler } from './BackgroundMessageHandler';

/**
 * Handles reading and updating persistent extension settings.
 * Updates are stored centrally and broadcast to the sender page when available.
 * Settings behavior is shared by the Assistant and Inspector workers.
 */
export class SettingsMessageHandler implements BackgroundMessageHandler {
    private readonly pageClient: PageSettingsClient;
    private readonly settingsStorage: SettingsStorage;

    constructor(pageClient: PageSettingsClient, settingsStorage: SettingsStorage) {
        this.pageClient = pageClient;
        this.settingsStorage = settingsStorage;
    }

    routes() {
        return [
            MessageRouter.route(isGetSettingsMessage, () => this.handleGetSettings()),
            MessageRouter.route(isUpdateSettingsMessage, (message, context) =>
                this.handleUpdateSettings(message, context),
            ),
        ];
    }

    /** Reads the currently persisted extension settings. */
    handleGetSettings(): Promise<ExtensionSettings> {
        return this.settingsStorage.get();
    }

    /** Persists a settings patch and notifies the sender page of the result. */
    async handleUpdateSettings(message: UpdateSettingsMessage, context: MessageContext): Promise<ExtensionSettings> {
        const updatedSettings = await this.settingsStorage.update(message.data.patch);
        if (context.pageId !== undefined) {
            void this.pageClient.notifySettingsUpdated(context.pageId, updatedSettings).catch(() => undefined);
        }
        return updatedSettings;
    }
}
