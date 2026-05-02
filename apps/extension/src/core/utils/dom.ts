/**
 * Returns the first HTMLElement in the event's composed path.
 * @param e - The event to get the target from.
 * @returns The first HTMLElement in the composed path, or null if none found.
 */
export function getEventTarget(e: Event): HTMLElement | null {
    return e.composedPath().find((el): el is HTMLElement => el instanceof HTMLElement) ?? null;
}
