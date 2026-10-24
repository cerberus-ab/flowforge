import type { MarkdownOptionBlock, MarkdownOptionDetailLevel } from '@flowforge/page-trail';
import { MARKDOWN_OPTION_BLOCKS } from './inspector';
import type { InspectorTabId } from './inspector';

export interface MarkdownPreferences {
    detailLevel: MarkdownOptionDetailLevel;
    blocks: MarkdownOptionBlock[];
}

export type ExtensionSettingsTheme = 'light' | 'dark';

export interface ExtensionSettings {
    theme: ExtensionSettingsTheme;
    devMode: boolean;
    inspectorTab: InspectorTabId;
    markdownDetailLevel: MarkdownOptionDetailLevel;
    markdownBlocks: MarkdownOptionBlock[];
}

export type ExtensionSettingsPatch = Partial<ExtensionSettings>;

export const DEFAULT_MARKDOWN_PREFERENCES: MarkdownPreferences = {
    detailLevel: 'standard',
    blocks: [...MARKDOWN_OPTION_BLOCKS],
};
