import { getElementBoundingBox } from './primitive/view.ts';
import type { ElementDescriptor } from '#self/types';
import getCssSelector from 'css-selector-generator';

/**
 * Builds a stable descriptor payload for a DOM element
 *
 * @param el - Source DOM element.
 * @param getElementDataId - Get an unique element dataId to locate it.
 * @returns Element descriptor metadata including tag, generated data id, CSS selector, and bounding box.
 */
export function extractElementDescriptor(el: Element, getElementDataId: (el: Element) => string): ElementDescriptor {
    const selector = getCssSelector(el);
    const bbox = getElementBoundingBox(el);

    return {
        tag: el.tagName.toLowerCase(),
        dataId: getElementDataId(el),
        selector,
        bbox,
    };
}
