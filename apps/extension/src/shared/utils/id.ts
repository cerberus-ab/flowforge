/** Generates a UUID v4 using the Web Crypto API. */
export function generateUniqueId(): string {
    return crypto.randomUUID();
}
