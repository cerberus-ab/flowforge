import type { LocalStorage } from '@/adapters';
import { constants } from '@/shared/constants';
import { INSPECTOR_TAB_IDS, MARKDOWN_OPTION_BLOCKS, type InspectorTabId } from '@/shared/types/inspector';
import type { ExtensionSettings, ExtensionSettingsPatch } from '@/shared/types/settings';
import type { MarkdownOptionBlock, MarkdownOptionDetailLevel } from '@flowforge/page-trail';

const SETTINGS_STORAGE_KEY = `${constants.STORAGE_NAMESPACE}_settings`;

// guards
function isInspectorTabId(value: unknown): value is InspectorTabId {
    return typeof value === 'string' && INSPECTOR_TAB_IDS.includes(value as InspectorTabId);
}

function isMarkdownOptionDetailLevel(value: unknown): value is MarkdownOptionDetailLevel {
    return value === 'compact' || value === 'standard' || value === 'full';
}

function isMarkdownOptionBlock(value: unknown): value is MarkdownOptionBlock {
    return typeof value === 'string' && MARKDOWN_OPTION_BLOCKS.includes(value as MarkdownOptionBlock);
}

export class SettingsStorage {
    private readonly storage: LocalStorage;
    private readonly defaults: ExtensionSettings;
    private updateQueue: Promise<void> = Promise.resolve();

    constructor(storage: LocalStorage, defaults: ExtensionSettings, initialSettings: ExtensionSettingsPatch = {}) {
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
        const stored = (await this.storage.get<ExtensionSettingsPatch>(SETTINGS_STORAGE_KEY)) ?? {};
        const blocks = Array.isArray(stored.markdownBlocks)
            ? [...new Set(stored.markdownBlocks.filter(isMarkdownOptionBlock))]
            : [...this.defaults.markdownBlocks];
        return {
            ...this.defaults,
            ...stored,
            inspectorTab: isInspectorTabId(stored.inspectorTab) ? stored.inspectorTab : this.defaults.inspectorTab,
            markdownDetailLevel: isMarkdownOptionDetailLevel(stored.markdownDetailLevel)
                ? stored.markdownDetailLevel
                : this.defaults.markdownDetailLevel,
            markdownBlocks: blocks,
        };
    }

    /**
     * Update settings with a partial patch, merging it with existing settings
     */
    async update(patch: ExtensionSettingsPatch): Promise<ExtensionSettings> {
        const update = this.updateQueue.then(async () => {
            const stored = (await this.storage.get<ExtensionSettingsPatch>(SETTINGS_STORAGE_KEY)) ?? {};
            const nextStored: ExtensionSettingsPatch = {
                ...stored,
                ...patch,
            };
            await this.storage.set(SETTINGS_STORAGE_KEY, nextStored);
        });
        this.updateQueue = update.catch(() => undefined);
        await update;
        return this.get();
    }
}
