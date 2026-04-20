/**
 * Generates a unique data id for an element
 */
export function generateDataId(): string {
    return `ff${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Validate a given data id
 */
export function validateDataId(dataId: string): boolean {
    return /^ff[0-9a-f]{8}$/i.test(dataId);
}

