import { normalizeText } from '../../../utils/index.ts';

/**
 * Extracts normalized text content from an element.
 *
 * Returns an empty string when the element has no text after normalization.
 */
export function getElementText(el: Element, options: { maxLength?: number } = {}): string | undefined {
    const text = el.textContent;
    if (text == null) return undefined;

    return normalizeText(text, options);
}
