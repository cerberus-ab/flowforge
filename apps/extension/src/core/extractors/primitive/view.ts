import type { BoundingBox } from '@flowforge/shared';

/**
 * Check if element is visible
 */
export function isElementVisible(el: Element): boolean {
    const style = window.getComputedStyle(el);
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
