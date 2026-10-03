import { semSampleStructure, semSampleInteractions, semSampleTexts } from './basics.ts';
import type { PageTrail } from '../../PageTrail.ts';
import { placeholder } from '../constants.ts';

function formatOptionalText(text: string): string {
    return text || placeholder.NONE;
}

function formatMarkdownListItem(text: string, options: { offset?: number; numb?: number } = {}): string {
    return `${' '.repeat(2 * (options?.offset ?? 0))}${options?.numb !== undefined ? `${options?.numb}.` : '-'} ${text}`;
}

function formatOptionalMarkdownList(items: string[]): string[] {
    return items.length > 0 ? items : [placeholder.NONE];
}

// Renderers

type MarkdownBlockRenderer = (pageTrail: PageTrail, options: ResolvedMarkdownOptions) => string[];

// summary
function semMarkdownSummary(options: ResolvedMarkdownOptions): string {
    const descriptions: Record<MarkdownOptionBlock, string> = {
        basics: 'page basics',
        structure: 'structure',
        interactive: 'key interactions',
        content: 'meaningful content',
    };
    const items = options.blocks.map((block) => descriptions[block]);

    if (items.length === 0) return 'No semantic sections selected.';
    if (items.length === 1) return `A semantic overview of ${items[0]}.`;
    if (items.length === 2) return `A semantic overview of ${items.join(' and ')}.`;
    return `A semantic overview of ${items.slice(0, -1).join(', ')}, and ${items.at(-1)}.`;
}

// basics
const semMarkdownBasics: MarkdownBlockRenderer = (pageTrail) => {
    const lines = [];
    lines.push('## Basics');
    lines.push('');
    lines.push('Basic information about the current page.');
    lines.push('');
    lines.push(formatMarkdownListItem(`Title: ${pageTrail.basics.title}`));
    lines.push(formatMarkdownListItem(`URL: ${pageTrail.basics.url}`));
    lines.push(formatMarkdownListItem(`Description: ${formatOptionalText(pageTrail.basics.description)}`));
    lines.push(formatMarkdownListItem(`Language: ${pageTrail.basics.language}`));
    lines.push(
        formatMarkdownListItem(
            `Viewport: ${pageTrail.basics.viewport.width}x${pageTrail.basics.viewport.height}, ` +
                `scroll ${pageTrail.basics.viewport.scrollY}/${pageTrail.basics.viewport.scrollHeight}`,
        ),
    );
    lines.push('');
    return lines;
};

// structure
const semMarkdownStructure: MarkdownBlockRenderer = (pageTrail, options) => {
    const lines = [];
    lines.push('## Structure');
    lines.push('');
    lines.push('An outline of the detected page structure.');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleStructure(
                pageTrail,
                options.detailSettings.structureMaxDepth,
                options.detailSettings.structureBranchLimit,
            ).map(({ depth, text }) => formatMarkdownListItem(text, { offset: depth })),
        ),
    );
    lines.push('');
    return lines;
};

// interactive
const semMarkdownInteractive: MarkdownBlockRenderer = (pageTrail, options) => {
    const lines = [];
    lines.push('## Interactive');
    lines.push('');
    lines.push(`Key interactions sampled from the page.`);
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleInteractions(pageTrail.getInteractive(), options.detailSettings.interactiveLimit).map(
                (interaction, index) => formatMarkdownListItem(interaction, { numb: index + 1 }),
            ),
        ),
    );
    lines.push('');
    return lines;
};

// content
const semMarkdownContent: MarkdownBlockRenderer = (pageTrail, options) => {
    const lines = [];
    lines.push('## Content');
    lines.push('');
    lines.push('Meaningful content blocks sampled from the page.');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleTexts(
                pageTrail.getContent(),
                options.detailSettings.contentTextMinLength,
                options.detailSettings.contentTextLimit,
            ).map((text) => formatMarkdownListItem(text)),
        ),
    );
    lines.push('');
    return lines;
};

// Exports & options

// default list and sequence of blocks
const MARKDOWN_OPTION_BLOCKS = ['basics', 'structure', 'interactive', 'content'] as const;

export type MarkdownOptionBlock = (typeof MARKDOWN_OPTION_BLOCKS)[number];

const MARKDOWN_BLOCK_RENDERERS: Record<MarkdownOptionBlock, MarkdownBlockRenderer> = {
    basics: semMarkdownBasics,
    structure: semMarkdownStructure,
    interactive: semMarkdownInteractive,
    content: semMarkdownContent,
};

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

interface ResolvedMarkdownOptions {
    detailLevel: MarkdownOptionDetailLevel;
    blocks: MarkdownOptionBlock[];
    detailSettings: MarkdownDetailSettings;
}

function resolveMarkdownOptions(options: MarkdownOptions): ResolvedMarkdownOptions {
    const detail = options.detailLevel ?? 'standard';
    const blocks = [...(options.blocks ?? MARKDOWN_OPTION_BLOCKS)];
    const detailSettings = MARKDOWN_DETAIL_SETTINGS[detail];

    return { detailLevel: detail, blocks, detailSettings };
}

/**
 * Generates a human-readable Markdown page context from a `PageTrail`.
 *
 * Renders the selected context blocks in their configured order and applies
 * the requested detail level to structure, interaction, and content samples.
 *
 * @param pageTrail - Collected page context to render
 * @param options - Optional detail level and ordered context blocks
 * @returns Markdown document headed by "Page context"
 */
export function semMarkdown(pageTrail: PageTrail, options: MarkdownOptions = {}): string {
    const resolvedOptions = resolveMarkdownOptions(options);
    const lines: string[] = [];

    lines.push('# Page context');
    lines.push('');
    lines.push(semMarkdownSummary(resolvedOptions));
    lines.push('');

    lines.push(
        ...resolvedOptions.blocks.flatMap((block) => MARKDOWN_BLOCK_RENDERERS[block](pageTrail, resolvedOptions)),
    );
    return lines.join('\n');
}
