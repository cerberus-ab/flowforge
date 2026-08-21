import type { PageTrail } from '../../types/index.ts';
import { semSamplePageStructure, semSampleHeadings, semSampleInteractions } from './basics.ts';
import { semContentElement } from '../element/content.ts';
import { semInteractiveElement } from '../element/interactive.ts';

const PLACEHOLDER_NONE = '_None_';

function formatOptionalText(text: string): string {
    return text || PLACEHOLDER_NONE;
}

function formatMarkdownListItem(text: string, offset: number = 0): string {
    return `${' '.repeat(2 * offset)}- ${text}`;
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
    lines.push(formatOptionalText(semSampleHeadings(pageTrail.content)));
    lines.push('');

    lines.push('## Sample interactions');
    lines.push('');
    lines.push(formatOptionalText(semSampleInteractions(pageTrail.interactive)));
    lines.push('');

    lines.push('## Sample page structure');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            semSamplePageStructure(pageTrail.container).map(({ depth, text }) => formatMarkdownListItem(text, depth)),
        ),
    );
    lines.push('');

    lines.push('## Content');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            pageTrail.content.map((el) => semContentElement(el).text()).map((st) => formatMarkdownListItem(st)),
        ),
    );
    lines.push('');

    lines.push('## Interactive');
    lines.push('');
    lines.push(
        ...formatOptionalMarkdownList(
            pageTrail.interactive.map((el) => semInteractiveElement(el).text()).map((st) => formatMarkdownListItem(st)),
        ),
    );

    return lines.join('\n');
}
