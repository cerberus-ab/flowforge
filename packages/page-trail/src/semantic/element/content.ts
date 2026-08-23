import type { ContentElement } from '../../types/index.ts';
import { SemRecord } from '../SemRecord.ts';
import { semElementContextShort } from './context.ts';

// text, heading h1, etc.
function semContentElementDescriptor(element: ContentElement): string {
    if (element.type === 'heading') {
        return `${element.type} ${element.tag}`;
    }
    return element.type;
}

// Exports

/**
 * Builds a semantic record for a content element:
 * descriptor + payload text + optional compact context.
 *
 * Headings include their source heading tag in the descriptor.
 *
 * @param element - Content element
 * @param textOverride - Optional text instead of `element.text`
 * @returns Semantic record
 *
 * @example
 * // → "Text: Welcome. Context: main content"
 * semContentElement(el).text()
 *
 * @example
 * // → "Heading h1: Pricing"
 * semContentElement(el, 'Pricing').text()
 */
export function semContentElement(element: ContentElement, textOverride?: string): SemRecord {
    return SemRecord.builder()
        .withDescriptor(semContentElementDescriptor(element))
        .withPayload(textOverride ?? element.text)
        .withContext(semElementContextShort(element.context))
        .build();
}
