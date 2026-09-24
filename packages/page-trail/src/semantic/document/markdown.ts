import { semSampleStructure, semSampleInteractions, semSampleTexts } from './basics.ts';
import type { PageTrail } from '../../PageTrail.ts';
import { placeholder } from '../constants.ts';

const settings = {
    SAMPLE_STRUCTURE_MAX_DEPTH: 3,
    SAMPLE_STRUCTURE_BRANCH_LIMIT: 5,
    SAMPLE_INTERACTIONS_LIMIT: 15,
    SAMPLE_TEXT_MIN_LENGTH: 30,
    SAMPLE_TEXT_LIMIT: 15,
} as const;

function formatOptionalText(text: string): string {
    return text || placeholder.NONE;
}

function formatMarkdownListItem(text: string, options: { offset?: number; numb?: number } = {}): string {
    return `${' '.repeat(2 * (options?.offset ?? 0))}${options?.numb !== undefined ? `${options?.numb}.` : '-'} ${text}`;
}

function formatOptionalMarkdownList(items: string[]): string[] {
    return items.length > 0 ? items : [placeholder.NONE];
}

// Exports

/**
 * Generates a human-readable Markdown snapshot of a `PageTrail`.
 *
 * Intended for Inspector previews, debugging, copy/export flows, and examples
 * where the structured page model should be shown as semantic text.
 */
export function semMarkdown(pageTrail: PageTrail): string {
    const lines: string[] = [];

    lines.push('# Semantic view');
    lines.push('');

    // basics
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

    // structure
    lines.push('## Structure');
    lines.push('');
    lines.push('An outline of the detected page structure.');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleStructure(
                pageTrail,
                settings.SAMPLE_STRUCTURE_MAX_DEPTH,
                settings.SAMPLE_STRUCTURE_BRANCH_LIMIT,
            ).map(({ depth, text }) => formatMarkdownListItem(text, { offset: depth })),
        ),
    );
    lines.push('');

    // interactions
    lines.push('## Interactions');
    lines.push('');
    lines.push(`Up to ${settings.SAMPLE_INTERACTIONS_LIMIT} representative interactions on the page.`);
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleInteractions(pageTrail.getInteractive(), settings.SAMPLE_INTERACTIONS_LIMIT).map(
                (interaction, index) => formatMarkdownListItem(interaction, { numb: index + 1 }),
            ),
        ),
    );
    lines.push('');

    // content
    lines.push('## Content');
    lines.push('');
    lines.push('Some meaningful content blocks sampled from the page.');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleTexts(pageTrail.getContent(), settings.SAMPLE_TEXT_MIN_LENGTH, settings.SAMPLE_TEXT_LIMIT).map(
                (text) => formatMarkdownListItem(text),
            ),
        ),
    );
    lines.push('');

    return lines.join('\n');
}
