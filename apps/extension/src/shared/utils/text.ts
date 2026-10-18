/**
 * Normalizes text by collapsing consecutive whitespace into a single space
 * and trimming leading/trailing whitespace.
 *
 * @param text Input text to normalize.
 * @returns Normalized text.
 */
export function normalizeText(text: string) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\s+([.,!?;:])/g, '$1')
        .trim();
}
