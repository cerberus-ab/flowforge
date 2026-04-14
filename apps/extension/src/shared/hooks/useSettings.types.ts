import type { ExtensionSettings } from '#self/types';

export interface SettingsActions {
    toggleTheme: () => Promise<void>;
}

export type SettingsViewModel = ExtensionSettings & SettingsActions;
