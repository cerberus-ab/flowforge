import type { LocalStorage } from '@/adapters';
import { constants } from '@/shared/constants';

export type ExtensionSettingsTheme = 'light' | 'dark';

export interface ExtensionSettings {
    theme: ExtensionSettingsTheme;
    devMode: boolean;
}

const SETTINGS_STORAGE_KEY = `${constants.STORAGE_NAMESPACE}_settings`;

export class SettingsStorage {
    private readonly storage: LocalStorage;
    private readonly defaults: ExtensionSettings;

    constructor(storage: LocalStorage, defaults: ExtensionSettings, initialSettings: Partial<ExtensionSettings> = {}) {
        this.storage = storage;
        this.defaults = {
            ...defaults,
            ...initialSettings,
        };
    }

    /**
     * Get the current settings
     */
    async get(): Promise<ExtensionSettings> {
        const stored = (await this.storage.get<Partial<ExtensionSettings>>(SETTINGS_STORAGE_KEY)) ?? {};
        return {
            ...this.defaults,
            ...stored,
        };
    }

    /**
     * Update settings with a partial patch, merging it with existing settings
     */
    async update(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
        const stored = (await this.storage.get<Partial<ExtensionSettings>>(SETTINGS_STORAGE_KEY)) ?? {};
        const nextStored: Partial<ExtensionSettings> = {
            ...stored,
            ...patch,
        };
        await this.storage.set(SETTINGS_STORAGE_KEY, nextStored);
        return this.get();
    }
}
