import { constants } from '#self/constants';
import type { ElementLocator } from '@flowforge/shared';
import { getElementBoundingBox } from './primitive/view';

/**
 * Builds a CSS selector for a DOM element.
 *
 * Resolution order:
 * 1. Use `#id` when available.
 * 2. Use a `data-testid\*` or `data-id\*` attribute when present.
 * 3. Fallback to `tag.class1.class2:nth-child(n)`.
 *
 * @param el - Target DOM element.
 * @returns CSS selector string for the element.
 */
function getElementSelector(el: Element): string {
    if (el.id) return `#${el.id}`;

    // Check for unique data attributes
    for (let attr of el.attributes) {
        if (attr.name.startsWith('data-testid') || attr.name.startsWith('data-id')) {
            return `[${attr.name}="${attr.value}"]`;
        }
    }

    // Build selector with tag, classes, and nth-child
    const tag = el.tagName.toLowerCase();
    const classes =
        el.className && typeof el.className === 'string'
            ? '.' +
              el.className
                  .split(' ')
                  .filter((c) => c)
                  .join('.')
            : '';

    const parent = el.parentNode;
    if (!parent) return tag + classes;

    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(el) + 1;

    return `${tag}${classes}:nth-child(${index})`;
}

/**
 * Builds an XPath locator for the provided element.
 *
 * Uses an `id`-based XPath when available for brevity and stability.
 * Otherwise, builds an absolute XPath by walking up the DOM tree and
 * adding sibling indexes for repeated tag names.
 *
 * @deprecated Use `selector` and `dataId` instead.
 * @param el - Target DOM element.
 * @returns XPath string for the element, or an empty string if it cannot be built.
 */
function getElementXPath(el: Element): string {
    if (el.id) return `//*[@id="${el.id}"]`;

    const parts: string[] = [];
    let current: Node | null = el;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
        let index = 0;
        let sibling = current.previousSibling;

        while (sibling) {
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === current.nodeName) {
                index++;
            }
            sibling = sibling.previousSibling;
        }
        const tagName = current.nodeName.toLowerCase();
        const pathIndex = index > 0 ? `[${index + 1}]` : '';
        parts.unshift(tagName + pathIndex);
        current = current.parentNode;
    }

    return parts.length ? '/' + parts.join('/') : '';
}

/**
 * Returns a stable data id for the given element.
 * Reuses the existing value in `constants.DATA_ID_ATTRIBUTE` when present.
 * Otherwise, generates a UUID, stores it on the element, and returns it.
 *
 * @param el - DOM element to read/write the data id on.
 * @returns The element data id value.
 */
function createElementDataId(el: Element): string {
    let dataId = el.getAttribute(constants.DATA_ID_ATTRIBUTE) ?? '';
    if (!dataId) {
        dataId = crypto.randomUUID();
        el.setAttribute(constants.DATA_ID_ATTRIBUTE, dataId);
    }
    return dataId;
}

/**
 * Builds a stable locator payload for a DOM element
 *
 * @param el - Source DOM element.
 * @returns Element locator metadata including tag, generated data id, CSS selector, and bounding box.
 */
export function extractElementLocator(el: Element): ElementLocator {
    return {
        tag: el.tagName.toLowerCase(),
        dataId: createElementDataId(el),
        selector: getElementSelector(el),
        bbox: getElementBoundingBox(el),
    };
}
