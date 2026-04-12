import { normalizeText } from '#self/core/utils/text';

/**
 * Extracts normalized user-visible text from an element.
 *
 * Returns undefined if the element does not contain meaningful text.
 */
export function getElementText(el: Element): string | undefined {
    const text = el.textContent;
    if (!text) return undefined;

    const normalized = normalizeText(text);
    return normalized || undefined;
}
