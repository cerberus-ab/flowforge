import { useCallback, useEffect, useState } from 'preact/hooks';
import type { TransportService } from '@/adapters/interface';
import {
    type ExtensionSettings,
    type GetSettingsMessage,
    type GetSettingsMessageResponse,
    type UpdateSettingsMessage,
    type UpdateSettingsMessageResponse,
    isSettingsUpdatedMessage,
    type Message,
    type MessageResponse,
} from '@/types';
import { config } from '@/config';

interface UseSettingsParams {
    transport: TransportService;
}

export interface SettingsReadyViewModel extends ExtensionSettings {
    status: 'ready';
    toggleTheme: () => Promise<void>;
    setDevMode: (enabled: boolean) => Promise<void>;
}

export interface SettingsLoadingViewModel {
    status: 'loading';
}

export type SettingsViewModel = SettingsLoadingViewModel | SettingsReadyViewModel;

export function useSettings({ transport }: UseSettingsParams): SettingsViewModel {
    const [settings, setSettings] = useState<ExtensionSettings | null>(null);

    // Get settings on mount
    useEffect(() => {
        void (async () => {
            try {
                const response = await transport.sendToBackground<GetSettingsMessage, GetSettingsMessageResponse>({
                    type: 'GET_SETTINGS',
                });
                setSettings(response.success ? response.data : config.defaultSettings);
            } catch {
                setSettings(config.defaultSettings);
            }
        })();
    }, [transport]);

    useEffect(() => {
        return transport.addMessageListener((message: Message): MessageResponse | undefined => {
            if (isSettingsUpdatedMessage(message)) {
                setSettings(message.data);
                return { success: true };
            }
            return undefined;
        });
    }, [transport]);

    const handleUpdateSettings = useCallback(
        async (patch: Partial<ExtensionSettings>) => {
            const senderId = await transport.getActiveSenderId().catch(() => undefined);
            const response = await transport.sendToBackground<UpdateSettingsMessage, UpdateSettingsMessageResponse>({
                type: 'UPDATE_SETTINGS',
                senderId,
                data: { patch },
            });
            if (response.success) {
                setSettings(response.data);
            }
        },
        [transport],
    );

    if (!settings) {
        return { status: 'loading' };
    }
    return {
        status: 'ready',
        ...settings,
        toggleTheme: () => handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }),
        setDevMode: (enabled: boolean) => handleUpdateSettings({ devMode: enabled }),
    };
}
