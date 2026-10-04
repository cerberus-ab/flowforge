import type { TransportService } from '@/adapters/interface';
import {
    type ClearPageMessage,
    type GetSettingsMessageResponse,
    isGetSettingsMessage,
    isOpenPageInspectorMessage,
    isPopupInitializeMessage,
    isUpdateSettingsMessage,
    type Message,
    type MessageResponse,
    type OpenInspectorMessage,
    type OpenPageInspectorMessage,
    type PopupInitializeMessage,
    type SettingsUpdatedMessage,
    type UpdateSettingsMessage,
    type UpdateSettingsMessageResponse,
} from '@/types';
import type { SettingsStorage } from '@/core/services/SettingsStorage';

export class InspectorBackgroundWorker {
    private readonly transport: TransportService;
    private unsubscribe?: () => void;
    private readonly settingsStorage: SettingsStorage;

    constructor(transport: TransportService, settingsStorage: SettingsStorage) {
        this.transport = transport;
        this.settingsStorage = settingsStorage;
    }

    start(): void {
        this.unsubscribe = this.transport.addMessageListener((message: Message) => {
            if (isPopupInitializeMessage(message)) {
                return this.handlePopupInitialize(message);
            }
            if (isGetSettingsMessage(message)) {
                return this.handleGetSettings();
            }
            if (isUpdateSettingsMessage(message)) {
                return this.handleUpdateSettings(message);
            }
            if (isOpenPageInspectorMessage(message)) {
                return this.handleOpenPageInspector(message);
            }
        });
        console.log('[FlowForge: Page Inspector] Background worker loaded and started');
    }

    stop(): void {
        this.unsubscribe?.();
        console.log('[FlowForge: Page Inspector] Background worker stopped');
    }

    /** Clears page UI state when the popup opens */
    private handlePopupInitialize(message: PopupInitializeMessage): MessageResponse {
        void this.transport
            .sendToPage<ClearPageMessage>(message.senderId, {
                type: 'CLEAR_PAGE',
            })
            .catch(() => undefined);

        return { success: true };
    }

    /** Retrieves extension settings from storage */
    private async handleGetSettings(): Promise<GetSettingsMessageResponse> {
        try {
            const settings = await this.settingsStorage.get();
            return { success: true, data: settings };
        } catch (error) {
            console.error('[FlowForge: Page Inspector] Error getting extension settings:', error);
            throw error;
        }
    }

    /** Updates extension settings with a partial patch */
    private async handleUpdateSettings(message: UpdateSettingsMessage): Promise<UpdateSettingsMessageResponse> {
        try {
            const updatedSettings = await this.settingsStorage.update(message.data.patch);
            if (message.senderId !== undefined) {
                void this.transport
                    .sendToPage<SettingsUpdatedMessage>(message.senderId, {
                        type: 'SETTINGS_UPDATED',
                        data: updatedSettings,
                    })
                    .catch(() => undefined);
            }
            return { success: true, data: updatedSettings };
        } catch (error) {
            console.error('[FlowForge: Page Inspector] Error updating extension settings:', error);
            throw error;
        }
    }

    /** Clears the page state and opens the inspector */
    private async handleOpenPageInspector(message: OpenPageInspectorMessage): Promise<MessageResponse> {
        try {
            // Clear page
            await this.transport.sendToPage<ClearPageMessage>(message.senderId, {
                type: 'CLEAR_PAGE',
            });
            // Open inspector
            await this.transport.sendToPage<OpenInspectorMessage>(message.senderId, {
                type: 'OPEN_INSPECTOR',
                data: message.data,
            });
            return { success: true };
        } catch (error) {
            console.error('[FlowForge: Page Inspector] Error opening page inspector:', error);
            throw error;
        }
    }
}
