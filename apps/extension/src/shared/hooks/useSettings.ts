import { useCallback, useEffect, useState } from 'preact/hooks';
import type { TransportService } from '#self/adapters/interface';
import {
    type ExtensionSettings,
    type ExtensionSettingsTheme,
    type GetSettingsMessage,
    type GetSettingsMessageResponse,
    isApplySettingsMessage,
    type UpdateSettingsMessage,
    type UpdateSettingsMessageResponse,
} from '#self/types';
import { config } from '#self/config';
import type { SettingsViewModel } from './useSettings.types';

interface UseSettingsParams {
    transport: TransportService;
}

export function useSettings({ transport }: UseSettingsParams): SettingsViewModel {
    const [settings, setSettings] = useState<ExtensionSettings>(config.defaultSettings);

    // Get settings on mount
    useEffect(() => {
        void (async () => {
            const response = await transport.sendToBackground<GetSettingsMessage, GetSettingsMessageResponse>({
                type: 'GET_SETTINGS',
            });
            if (response.success) {
                setSettings(response.data);
            }
        })();
    }, [transport]);

    // Handle theme toggle
    const handleToggleTheme = useCallback(async () => {
        const nextTheme: ExtensionSettingsTheme = settings.theme === 'dark' ? 'light' : 'dark';
        const response = await transport.sendToBackground<UpdateSettingsMessage, UpdateSettingsMessageResponse>({
            type: 'UPDATE_SETTINGS',
            senderId: await transport.getActiveSenderId(),
            data: {
                patch: { theme: nextTheme },
            },
        });
        if (response.success) {
            setSettings(response.data);
        }
    }, [settings, transport]);

    // Listen to settings updates from background
    useEffect(() => {
        return transport.addMessageListener((message) => {
            if (isApplySettingsMessage(message)) {
                setSettings(message.data.settings);
                return { success: true };
            }
            return undefined;
        });
    }, [transport]);

    return {
        ...settings,
        toggleTheme: handleToggleTheme,
    };
}
