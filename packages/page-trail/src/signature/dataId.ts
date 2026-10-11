import { fnv1a64 } from '../utils/index.ts';

/**
 * Creates a stable signature for a set of data IDs.
 * IDs are sorted before hashing, and the unique ID count prefixes the hash.
 * Returns undefined when data IDs are unavailable, as in context-only mode.
 * This non-cryptographic signature only detects whether the locator set changed.
 */
export function createDataIdSignature(dataIds: string[] | undefined): string | undefined {
    if (dataIds === undefined) return undefined;

    // Treat IDs as a set so duplicate references and input order do not affect the signature.
    const sortedDataIds = [...new Set(dataIds)].sort();
    // Length-prefix each ID to keep the canonical input unambiguous; include the count for display.
    const canonicalValue = `${sortedDataIds.length};${sortedDataIds.map((id) => `${id.length}:${id};`).join('')}`;

    return `${sortedDataIds.length}-${fnv1a64(canonicalValue)}`;
}
