import type { PageTrail } from '../../types/index.ts';
import { semSampleStructure, semSampleHeadings, semSampleInteractions, semSampleTexts } from './basics.ts';

const PLACEHOLDER_NONE = '_None_';

const settings = {
    SAMPLE_STRUCTURE_MAX_DEPTH: 3,
    SAMPLE_STRUCTURE_BRANCH_LIMIT: 5,
    SAMPLE_HEADINGS_LIMIT: 5,
    SAMPLE_INTERACTIONS_LIMIT: 15,
    SAMPLE_TEXT_MIN_LENGTH: 30,
    SAMPLE_TEXT_LIMIT: 15,
} as const;

function formatOptionalText(text: string): string {
    return text || PLACEHOLDER_NONE;
}

function formatMarkdownListItem(text: string, options: { offset?: number; numb?: number } = {}): string {
    return `${' '.repeat(2 * (options?.offset ?? 0))}${options?.numb !== undefined ? `${options?.numb}.` : '-'} ${text}`;
}

function formatOptionalMarkdownList(items: string[]): string[] {
    return items.length > 0 ? items : [PLACEHOLDER_NONE];
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
    lines.push('## Page');
    lines.push('');
    lines.push('Basic information about the current page.');
    lines.push('');
    lines.push(`- Title: ${pageTrail.basics.title}`);
    lines.push(`- URL: ${pageTrail.basics.url}`);
    lines.push(`- Description: ${formatOptionalText(pageTrail.basics.description)}`);
    lines.push(`- Language: ${pageTrail.basics.language}`);
    lines.push(
        `- Viewport: ${pageTrail.basics.viewport.width}x${pageTrail.basics.viewport.height}, ` +
            `scroll ${pageTrail.basics.viewport.scrollY}/${pageTrail.basics.viewport.scrollHeight}`,
    );
    lines.push('');

    // structure
    lines.push('## Sample structure');
    lines.push('');
    lines.push('An outline of the detected page structure.');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleStructure(
                pageTrail.structure,
                settings.SAMPLE_STRUCTURE_MAX_DEPTH,
                settings.SAMPLE_STRUCTURE_BRANCH_LIMIT,
            ).map(({ depth, text }) => formatMarkdownListItem(text, { offset: depth })),
        ),
    );
    lines.push('');

    // headings
    lines.push('## Sample headings');
    lines.push('');
    lines.push(`Up to ${settings.SAMPLE_HEADINGS_LIMIT} representative headings on the page.`);
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleHeadings(pageTrail.content, settings.SAMPLE_HEADINGS_LIMIT).map((heading, index) =>
                formatMarkdownListItem(heading, { numb: index + 1 }),
            ),
        ),
    );
    lines.push('');

    // interactions
    lines.push('## Sample interactions');
    lines.push('');
    lines.push(`Up to ${settings.SAMPLE_INTERACTIONS_LIMIT} representative interactions on the page.`);
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleInteractions(pageTrail.interactive, settings.SAMPLE_INTERACTIONS_LIMIT).map((interaction, index) =>
                formatMarkdownListItem(interaction, { numb: index + 1 }),
            ),
        ),
    );
    lines.push('');

    // content
    lines.push('## Meaningful content');
    lines.push('');
    lines.push('Some meaningful text blocks sampled from the page.');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSampleTexts(pageTrail.content, settings.SAMPLE_TEXT_MIN_LENGTH, settings.SAMPLE_TEXT_LIMIT),
        ),
    );
    lines.push('');

    return lines.join('\n');
}
