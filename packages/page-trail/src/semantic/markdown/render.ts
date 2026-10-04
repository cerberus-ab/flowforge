import type { PageTrail } from '../../PageTrail.ts';
import { semSampleInteractions, semSampleStructure, semSampleTexts } from '../document/basics.ts';
import { placeholder } from '../constants.ts';
import type { MarkdownOptionBlock, ResolvedMarkdownOptions } from './options.ts';

function formatOptionalText(text: string): string {
    return text || placeholder.NONE;
}

function formatMarkdownListItem(text: string, options: { offset?: number; numb?: number } = {}): string {
    return `${' '.repeat(2 * (options?.offset ?? 0))}${options?.numb !== undefined ? `${options?.numb}.` : '-'} ${text}`;
}

function formatOptionalMarkdownList(items: string[]): string[] {
    return items.length > 0 ? items : [placeholder.NONE];
}

type MarkdownLinesRenderer = (pageTrail: PageTrail, options: ResolvedMarkdownOptions) => string[];

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

// header
const renderMarkdownHeader: MarkdownLinesRenderer = (pageTrail, options) => {
    const lines: string[] = [];

    lines.push('# Page context');
    lines.push('');
    lines.push(semMarkdownSummary(options));
    lines.push('');
    return lines;
};

// basics
const renderMarkdownBasics: MarkdownLinesRenderer = (pageTrail) => {
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
const renderMarkdownStructure: MarkdownLinesRenderer = (pageTrail, options) => {
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
const renderMarkdownInteractive: MarkdownLinesRenderer = (pageTrail, options) => {
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
const renderMarkdownContent: MarkdownLinesRenderer = (pageTrail, options) => {
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

const MARKDOWN_BLOCK_RENDERERS: Record<MarkdownOptionBlock, MarkdownLinesRenderer> = {
    basics: renderMarkdownBasics,
    structure: renderMarkdownStructure,
    interactive: renderMarkdownInteractive,
    content: renderMarkdownContent,
};

// Exports

export function renderMarkdown(pageTrail: PageTrail, options: ResolvedMarkdownOptions): string {
    const lines: string[] = [];
    lines.push(...renderMarkdownHeader(pageTrail, options));
    lines.push(...options.blocks.flatMap((block) => MARKDOWN_BLOCK_RENDERERS[block](pageTrail, options)));

    return lines.join('\n');
}
