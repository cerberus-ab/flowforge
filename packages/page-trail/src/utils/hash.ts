// FNV-1a 64-bit constants: offset basis and multiplication prime.
const FNV_64_OFFSET_BASIS = 14695981039346656037n;
const FNV_64_PRIME = 1099511628211n;

/**
 * Hashes a string with the non-cryptographic FNV-1a 64-bit algorithm.
 * Its UTF-8 bytes are XORed into the hash before multiplying with 64-bit overflow.
 *
 * @param value - The string to hash.
 * @returns A zero-padded, 16-character hexadecimal hash.
 */
export function fnv1a64(value: string): string {
    let hash = FNV_64_OFFSET_BASIS;

    for (const byte of new TextEncoder().encode(value)) {
        hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * FNV_64_PRIME);
    }

    return hash.toString(16).padStart(16, '0');
}
