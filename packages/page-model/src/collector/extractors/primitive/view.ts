import type { BoundingBox, Viewport } from '#self/types';

/**
 * Check if element is visible
 */
export function isElementVisible(el: Element, win: Window): boolean {
    const style = win.getComputedStyle(el);
    return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        style.opacity !== '0' &&
        (el as HTMLElement).offsetParent !== null
    );
}

/**
 * Get the bounding box of an element
 */
export function getElementBoundingBox(el: Element): BoundingBox {
    const rect = el.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        right: rect.right,
        bottom: rect.bottom,
    };
}

/**
 * Check if an element is in the viewport by bounding box
 */
export function isInViewport(bbox: BoundingBox, viewport: Viewport): boolean {
    return bbox.bottom > viewport.scrollY && bbox.top < viewport.scrollY + viewport.height;
}

/**
 * Check if an element is above the fold by bounding box
 */
export function isAboveTheFold(bbox: BoundingBox, viewport: Viewport): boolean {
    return bbox.top < viewport.height;
}
