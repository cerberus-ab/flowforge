import { useCallback, useEffect, useState } from 'preact/hooks';
import type { TransportService } from '@/adapters/interface';
import {
    type ExtensionSettings,
    type GetSettingsMessage,
    type GetSettingsMessageResponse,
    type UpdateSettingsMessage,
    type UpdateSettingsMessageResponse,
} from '@/types';
import { config } from '@/config';

interface UseSettingsParams {
    transport: TransportService;
}

export interface SettingsViewModel extends ExtensionSettings {
    toggleTheme: () => Promise<void>;
    setDevMode: (enabled: boolean) => Promise<void>;
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

    const handleUpdateSettings = useCallback(
        async (patch: Partial<ExtensionSettings>) => {
            const response = await transport.sendToBackground<UpdateSettingsMessage, UpdateSettingsMessageResponse>({
                type: 'UPDATE_SETTINGS',
                data: { patch },
            });
            if (response.success) {
                setSettings(response.data);
            }
        },
        [transport],
    );

    // Handle theme toggle
    const handleToggleTheme = useCallback(
        () => handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }),
        [handleUpdateSettings, settings.theme],
    );

    // Handle set dev mode
    const handleSetDevMode = useCallback(
        (enabled: boolean) => handleUpdateSettings({ devMode: enabled }),
        [handleUpdateSettings],
    );

    return {
        ...settings,
        toggleTheme: handleToggleTheme,
        setDevMode: handleSetDevMode,
    };
}
