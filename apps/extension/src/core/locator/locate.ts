import { constants } from '#self/constants';
import { generateDataId } from '@flowforge/shared';

/**
 * Returns a stable element data id for the given DOM element
 *
 * Reuses the existing value from the data attribute when present.
 * Otherwise, generates a new unique id, stores it on the element, and returns it.
 *
 * @param el - DOM element to read or assign the element id on.
 * @returns Stable element id associated with the element.
 */
export function getOrCreateDataId(el: Element): string {
    let dataId = el.getAttribute(constants.DATA_ID_ATTRIBUTE) ?? '';
    if (!dataId) {
        dataId = generateDataId();
        el.setAttribute(constants.DATA_ID_ATTRIBUTE, dataId);
    }
    return dataId;
}

/**
 * Finds a DOM element by its data id attribute, falling back to a CSS selector
 *
 * @param doc - The document to search within.
 * @param dataId - The value of the data id attribute to look up.
 * @param fallbackSelector - Optional CSS selector to use if the data id lookup fails.
 * @returns The matching element, or `null` if not found.
 */
export function findElement(doc: Document, dataId: string, fallbackSelector?: string): Element | null {
    let el: Element | null = null;
    try {
        if (dataId) {
            el = doc.querySelector(`[${constants.DATA_ID_ATTRIBUTE}="${dataId}"]`);
        }
        if (!el && fallbackSelector) {
            el = doc.querySelector(fallbackSelector);
        }
        return el;
    } finally {
        if (!el) {
            console.warn('[FlowForge] Element not found:', { dataId, fallbackSelector });
        }
    }
}
