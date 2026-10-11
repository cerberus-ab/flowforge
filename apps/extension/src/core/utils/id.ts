/**
 * Generates a short random identifier from a UUID.
 *
 * The identifier is 8 hexadecimal characters long and may collide, so it
 * should not be used where globally unique IDs are required.
 */
export function generateUniqueId(): string {
    return crypto.randomUUID().slice(0, 8);
}
