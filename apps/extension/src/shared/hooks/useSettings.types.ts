import type { ExtensionSettings } from '@/types';

export interface SettingsActions {
    toggleTheme: () => Promise<void>;
}

export type SettingsViewModel = ExtensionSettings & SettingsActions;
