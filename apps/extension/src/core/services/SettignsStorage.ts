import type { LocalStorage } from '#self/adapters/interface';
import { constants } from '#self/constants';
import type { ExtensionSettings } from '#self/types';

const SETTINGS_STORAGE_KEY = `${constants.LOCAL_STORAGE_NAMESPACE}_settings`;

export class SettingsStorage {
    private readonly storage: LocalStorage;
    private readonly defaults: ExtensionSettings;

    constructor(storage: LocalStorage, defaults: ExtensionSettings) {
        this.storage = storage;
        this.defaults = { ...defaults };
    }

    /**
     * Get the current settings
     */
    async get(): Promise<ExtensionSettings> {
        const stored = (await this.storage.get<ExtensionSettings>(SETTINGS_STORAGE_KEY)) ?? {};
        return {
            ...this.defaults,
            ...stored,
        };
    }

    /**
     * Update settings with a partial patch, merging it with existing settings
     */
    async update(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
        const current = await this.get();
        const next: ExtensionSettings = {
            ...current,
            ...patch,
        };
        await this.storage.set(SETTINGS_STORAGE_KEY, next);
        return next;
    }
}
