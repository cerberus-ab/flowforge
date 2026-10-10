import type { TrailFingerprint } from '../types/index.ts';
import { fnv1a64 } from '../utils/index.ts';

interface TrailFingerprintSource {
    dataIds?: string[];
}

/**
 * Creates a stable fingerprint for the unique data IDs in a PageTrail.
 * IDs are sorted before hashing, and the unique ID count prefixes the hash.
 * Returns an undefined hash when the snapshot has no DOM locators. This
 * non-cryptographic hash is only used to detect whether the locator set changed.
 */
export function trailFingerprint({ dataIds }: TrailFingerprintSource): TrailFingerprint {
    if (dataIds === undefined) return { dataIdSignature: undefined };

    // Treat IDs as a set so duplicate references and input order do not affect the fingerprint.
    const sortedDataIds = [...new Set(dataIds)].sort();
    // Length-prefix each ID to keep the canonical input unambiguous; include the count for display.
    const canonicalValue = `${sortedDataIds.length};${sortedDataIds.map((id) => `${id.length}:${id};`).join('')}`;

    return {
        dataIdSignature: `${sortedDataIds.length}-${fnv1a64(canonicalValue)}`,
    };
}
