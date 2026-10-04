const MARKDOWN_OPTION_BLOCKS = ['basics', 'structure', 'interactive', 'content'] as const;

export type MarkdownOptionBlock = (typeof MARKDOWN_OPTION_BLOCKS)[number];

export type MarkdownOptionDetailLevel = 'compact' | 'standard' | 'full';

interface MarkdownDetailSettings {
    structureMaxDepth: number;
    structureBranchLimit: number;
    interactiveLimit: number;
    contentTextLimit: number;
    contentTextMinLength: number;
}

const MARKDOWN_DETAIL_SETTINGS: Record<MarkdownOptionDetailLevel, MarkdownDetailSettings> = {
    compact: {
        structureMaxDepth: 2,
        structureBranchLimit: 3,
        interactiveLimit: 5,
        contentTextLimit: 5,
        contentTextMinLength: 30,
    },
    standard: {
        structureMaxDepth: 3,
        structureBranchLimit: 5,
        interactiveLimit: 15,
        contentTextLimit: 15,
        contentTextMinLength: 30,
    },
    full: {
        structureMaxDepth: Number.POSITIVE_INFINITY,
        structureBranchLimit: Number.POSITIVE_INFINITY,
        interactiveLimit: Number.POSITIVE_INFINITY,
        contentTextLimit: Number.POSITIVE_INFINITY,
        contentTextMinLength: 30,
    },
};

export interface MarkdownOptions {
    detailLevel?: MarkdownOptionDetailLevel;
    blocks?: MarkdownOptionBlock[];
}

export interface ResolvedMarkdownOptions {
    detailLevel: MarkdownOptionDetailLevel;
    blocks: MarkdownOptionBlock[];
    detailSettings: MarkdownDetailSettings;
}

export function resolveMarkdownOptions(options: MarkdownOptions): ResolvedMarkdownOptions {
    const detail = options.detailLevel ?? 'standard';
    const blocks = [...(options.blocks ?? MARKDOWN_OPTION_BLOCKS)];
    const detailSettings = MARKDOWN_DETAIL_SETTINGS[detail];

    return { detailLevel: detail, blocks, detailSettings };
}
