/**
 * Normalizes text by collapsing consecutive whitespace into a single space,
 * trimming leading/trailing whitespace, and optionally truncating to a maximum
 * length.
 *
 * Truncation preserves the requested maximum length exactly. When possible, it
 * cuts at the last whitespace before the limit to avoid splitting words.
 *
 * @param text Input text to normalize.
 * @param options
 * @param options.maxLength Maximum length of the normalized text.
 * @returns Normalized text.
 */
export function normalizeText(text: string, options: { maxLength?: number } = {}): string {
    const normalized = text
        .replace(/\s+/g, ' ')
        .replace(/\s+([.,!?;:])/g, '$1')
        .trim();

    if (options.maxLength === undefined || normalized.length <= options.maxLength) {
        return normalized;
    }
    const sliced = normalized.slice(0, options.maxLength);
    const lastWhitespaceIndex = sliced.lastIndexOf(' ');

    if (lastWhitespaceIndex > 0) {
        return sliced.slice(0, lastWhitespaceIndex);
    }
    return sliced;
}

/**
 * Converts feature and category identifiers into stable uppercase snake case
 * for scoring diagnostics.
 *
 * Handles camelCase boundaries and whitespace/hyphen separators.
 *
 * @example
 * toUpperSnakeCase('hasVisibleText') // 'HAS_VISIBLE_TEXT'
 * toUpperSnakeCase('generic-unlabeled') // 'GENERIC_UNLABELED'
 */
export function toUpperSnakeCase(text: string): string {
    return text
        .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
        .replace(/[\s-]+/g, '_')
        .toUpperCase();
}

/**
 * Converts the first character of a string to uppercase.
 *
 * @param text Input text to capitalize.
 * @returns Text with an uppercase first character.
 */
export function capitaliseFirst(text: string): string {
    if (text.length < 1) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}
