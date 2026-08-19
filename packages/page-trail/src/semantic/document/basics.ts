import type { ContentElement, InteractiveElement } from '../../types/index.ts';
import { semInteractiveElement } from '../element/interactive.ts';
import { semContentElement } from '../element/content.ts';

// Exports

/**
 * Formats a small heading sample from content elements.
 *
 * Only heading elements are included. They are ordered by descending
 * `importanceScore`, limited by `headingsLimit`, formatted with
 * `semContentElement`, and joined with ` | `.
 *
 * @param contentElements - Content elements collected from the page
 * @param headingsLimit - Maximum number of headings to include
 * @returns Compact heading sample for previews or page-level summaries
 *
 * @example
 * // → "Heading h1: Pricing | Heading h2: Enterprise"
 * semSampleHeadings([
 *   { type: 'heading', tag: 'h2', text: 'Enterprise', importanceScore: { value: 0.7 } },
 *   { type: 'text', tag: 'p', text: 'Choose a plan', importanceScore: { value: 0.9 } },
 *   { type: 'heading', tag: 'h1', text: 'Pricing', importanceScore: { value: 1 } },
 * ], 2)
 *
 * @example
 * // → ""
 * semSampleHeadings([{ type: 'text', tag: 'p', text: 'No headings here', importanceScore: { value: 1 } }])
 */
export function semSampleHeadings(contentElements: ContentElement[], headingsLimit = 5): string {
    return contentElements
        .filter((el) => el.type === 'heading')
        .sort((a, b) => b.importanceScore.value - a.importanceScore.value)
        .slice(0, headingsLimit)
        .map((el) => semContentElement(el).text())
        .join(' | ');
}

/**
 * Formats a small interaction sample from interactive elements.
 *
 * Only elements with at least one label or text value are included. They are
 * ordered by descending `importanceScore`, limited by `interactionsLimit`,
 * formatted with `semInteractiveElement`, and joined with ` | `.
 *
 * @param interactiveElements - Interactive elements collected from the page
 * @param interactionsLimit - Maximum number of interactions to include
 * @returns Compact interaction sample for previews or page-level summaries
 *
 * @example
 * // → "Link. Name: Docs. Action: click action | Button. Name: Start. Action: click action"
 * semSampleInteractions([
 *   { role: 'button', text: 'Start', labels: [], importanceScore: { value: 0.7 } },
 *   { role: 'link', text: 'Docs', labels: [], importanceScore: { value: 1 } },
 *   { role: 'button', text: undefined, labels: [], importanceScore: { value: 0.9 } },
 * ], 2)
 *
 * @example
 * // → "Button. Name: Submit. Also labeled: Submit form. Action: click action"
 * semSampleInteractions([
 *   {
 *     role: 'button',
 *     text: 'Submit form',
 *     labels: [{ source: 'aria-label', value: 'Submit' }],
 *     importanceScore: { value: 1 },
 *   },
 * ])
 */
export function semSampleInteractions(interactiveElements: InteractiveElement[], interactionsLimit = 10): string {
    return interactiveElements
        .filter((el) => el.labels.length > 0 || el.text)
        .sort((a, b) => b.importanceScore.value - a.importanceScore.value)
        .slice(0, interactionsLimit)
        .map((el) => semInteractiveElement(el).text())
        .join(' | ');
}
