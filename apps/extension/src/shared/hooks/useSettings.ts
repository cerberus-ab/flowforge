import { useCallback, useEffect, useState } from 'preact/hooks';
import type { ExtensionSettings, ExtensionSettingsPatch } from '@/shared/types/settings';
import { config } from '@/config';
import type { SettingsBackgroundClient } from '@/background';
import type { MarkdownPreferences } from '@/shared/types/settings';

interface UseSettingsParams {
    backgroundClient: SettingsBackgroundClient;
}

export interface SettingsReadyViewModel extends ExtensionSettings {
    status: 'ready';
    toggleTheme: () => Promise<void>;
    setDevMode: (enabled: boolean) => Promise<void>;
    setInspectorTab: (tab: ExtensionSettings['inspectorTab']) => Promise<void>;
    setMarkdownPreferences: (preferences: MarkdownPreferences) => Promise<void>;
}

export interface SettingsLoadingViewModel {
    status: 'loading';
}

export type SettingsViewModel = SettingsLoadingViewModel | SettingsReadyViewModel;

export function useSettings({ backgroundClient }: UseSettingsParams): SettingsViewModel {
    const [settings, setSettings] = useState<ExtensionSettings | null>(null);

    // Get settings on mount
    useEffect(() => {
        void (async () => {
            try {
                setSettings(await backgroundClient.getSettings());
            } catch {
                setSettings(config.defaultSettings);
            }
        })();
    }, [backgroundClient]);

    useEffect(() => {
        return backgroundClient.subscribeToSettingsMessages({ onSettingsUpdated: setSettings });
    }, [backgroundClient]);

    const handleUpdateSettings = useCallback(
        async (patch: ExtensionSettingsPatch) => {
            try {
                setSettings(await backgroundClient.updateSettings(patch));
            } catch {
                // Keep the current settings when persistence fails.
            }
        },
        [backgroundClient],
    );

    if (!settings) {
        return { status: 'loading' };
    }
    return {
        status: 'ready',
        ...settings,
        toggleTheme: () => handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }),
        setDevMode: (enabled: boolean) => handleUpdateSettings({ devMode: enabled }),
        setInspectorTab: (inspectorTab) => handleUpdateSettings({ inspectorTab }),
        setMarkdownPreferences: ({ detailLevel, blocks }) =>
            handleUpdateSettings({ markdownDetailLevel: detailLevel, markdownBlocks: blocks }),
    };
}
