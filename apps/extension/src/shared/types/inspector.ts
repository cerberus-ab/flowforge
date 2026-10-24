import type { MarkdownOptionBlock } from '@flowforge/page-trail';

export type InspectorTabId = 'basics' | 'structure' | 'content' | 'interactive' | 'markdown' | 'metadata';

export const INSPECTOR_TAB_IDS: readonly InspectorTabId[] = [
    'basics',
    'structure',
    'content',
    'interactive',
    'markdown',
    'metadata',
];

export const MARKDOWN_OPTION_BLOCKS: readonly MarkdownOptionBlock[] = ['basics', 'structure', 'interactive', 'content'];
