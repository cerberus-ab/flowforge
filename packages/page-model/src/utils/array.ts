/**
 * Removes duplicate items from an array based on a key function
 *
 * @template T - The type of items in the array.
 * @param {T[]} items - The array of items to deduplicate.
 * @param {(item: T) => string} keyFn - A function that returns a unique key for each item.
 * @returns {T[]} A new array with duplicates removed, keeping the first occurrence of each key.
 */
export function dedupeBy<T>(items: T[], keyFn: (item: T) => string): T[] {
    const seen = new Set<string>();

    return items.filter((item) => {
        const key = keyFn(item);
        if (seen.has(key)) return false;

        seen.add(key);
        return true;
    });
}
