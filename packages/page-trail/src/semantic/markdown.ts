import type { PageTrail } from '../types/index.ts';
import {
    formatContentElement,
    formatInteractiveElement,
    formatSampleHeadings,
    formatSampleInteractions,
} from './format.ts';

// constants
const PLACEHOLDER_NONE = '_None_';

function formatMarkdownList(items: string[]): string[] {
    if (items.length === 0) return [PLACEHOLDER_NONE];
    return items.map((item) => `- ${item}`);
}

function formatOptionalText(text: string): string {
    return text || PLACEHOLDER_NONE;
}

/**
 * Generates a human-readable Markdown snapshot of a `PageTrail`.
 *
 * Intended for Inspector previews, debugging, copy/export flows, and examples
 * where the structured page model should be shown as semantic text.
 */
export function generateSemanticMarkdown(pageTrail: PageTrail): string {
    const lines: string[] = [];

    lines.push('# Semantic view');
    lines.push('');

    lines.push('## Page');
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

    lines.push('## Sample headings');
    lines.push('');
    lines.push(formatOptionalText(formatSampleHeadings(pageTrail.content)));
    lines.push('');

    lines.push('## Sample interactions');
    lines.push('');
    lines.push(formatOptionalText(formatSampleInteractions(pageTrail.interactive)));
    lines.push('');

    lines.push('## Content');
    lines.push('');
    lines.push(...formatMarkdownList(pageTrail.content.map((el) => formatContentElement(el))));
    lines.push('');

    lines.push('## Interactive');
    lines.push('');
    lines.push(...formatMarkdownList(pageTrail.interactive.map((el) => formatInteractiveElement(el))));

    return lines.join('\n');
}
