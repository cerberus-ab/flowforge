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
