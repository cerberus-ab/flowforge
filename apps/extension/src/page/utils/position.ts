import { constants } from '#self/constants';

interface Position {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface LabelLayout {
    maxWidth: number;
    top: number;
    left: number;
    placement: 'top' | 'bottom';
}

/**
 * Checks whether a measured position differs from the previous one
 *
 * @param prev Previous position, or `null` when no prior measurement exists.
 * @param next Current measured position.
 * @returns `true` if there is no previous position or any coordinate/dimension changed.
 */
export function isNewPosition(prev: Position | null, next: Position): boolean {
    if (!prev) return true;
    return prev.top !== next.top || prev.left !== next.left || prev.width !== next.width || prev.height !== next.height;
}

/**
 * Checks whether a measured label layout differs from the previous one
 *
 * @param prev Previous label layout, or `null` when no prior layout exists.
 * @param next Current measured label layout.
 * @returns `true` if there is no previous layout or any layout field changed.
 */
export function isNewLabelLayout(prev: LabelLayout | null, next: LabelLayout): boolean {
    if (!prev) return true;
    return (
        prev.maxWidth !== next.maxWidth ||
        prev.top !== next.top ||
        prev.left !== next.left ||
        prev.placement !== next.placement
    );
}

/**
 * Calculates the viewport-relative overlay position and size for a target element
 *
 * Uses the element's bounding rect (viewport coordinates) and applies highlight padding
 * and minimum dimensions. Works correctly with ShadowDOM fixed positioning.
 *
 * @param element - DOM element to measure.
 * @returns Viewport-relative position and size of the element, adjusted for padding.
 */
export function calcElementPosition(element: Element): Position {
    const rect = element.getBoundingClientRect();

    // Use viewport coordinates directly (no scroll offset needed for fixed positioning)
    const top = rect.top - constants.HIGHLIGHT_OVERLAY_PADDING;
    const left = rect.left - constants.HIGHLIGHT_OVERLAY_PADDING;
    const width = Math.max(rect.width + constants.HIGHLIGHT_OVERLAY_PADDING * 2, 30);
    const height = Math.max(rect.height + constants.HIGHLIGHT_OVERLAY_PADDING * 2, 12);

    return { top, left, width, height };
}

/**
 * Calculates layout values for a highlight label relative to a target element
 *
 * Determines:
 * - `maxWidth` based on available horizontal space and configured min/max bounds.
 * - `top` offset and `placement` (`top` or `bottom`) based on available vertical space.
 * - `left` offset adjusted to keep the label inside viewport boundaries.
 *
 * @param labelEl - Rendered label element used for runtime size measurement.
 * @param position - Absolute overlay position/size for the highlighted element.
 * @param targetEl - Viewport-relative bounding rect of the target element.
 * @returns Computed label layout values for positioning and sizing.
 */
export function calcLabelLayout(labelEl: Element, position: Position, targetEl: Element): LabelLayout {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const targetRect = targetEl.getBoundingClientRect();

    // Calculate preferred width
    const availableRight = viewportWidth - targetRect.left;
    const availableLeft = targetRect.left;

    const maxWidth = Math.min(
        constants.HIGHLIGHT_LABEL_MAX_WIDTH,
        Math.max(constants.HIGHLIGHT_LABEL_MIN_WIDTH, Math.max(availableRight, availableLeft) - 12),
    );

    // Calculate vertical position
    const labelRect = labelEl.getBoundingClientRect();
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const labelHeight = labelRect.height + 8;

    const showAbove = spaceAbove >= labelHeight || spaceAbove >= spaceBelow;
    const top = showAbove ? -(labelRect.height + 8) : position.height + 8;

    // Calculate horizontal position (position.left is already in viewport coordinates)
    const leftInViewport = position.left;
    let left = 0;

    // Prevent overflow right
    const overflowRight = leftInViewport + left + labelRect.width - viewportWidth + 12;
    if (overflowRight > 0) {
        left -= overflowRight;
    }

    // Prevent overflow left
    const overflowLeft = leftInViewport + left - 12;
    if (overflowLeft < 0) {
        left -= overflowLeft;
    }

    // Constrain to overlay width
    const minLeft = -(position.width - 24);
    left = Math.max(left, minLeft);

    // Final adjustment
    const finalRight = leftInViewport + left + labelRect.width;
    const finalLeft = leftInViewport + left;

    const finalOverflowRight = finalRight - (viewportWidth - 12);
    const finalOverflowLeft = 12 - finalLeft;

    if (finalOverflowRight > 0) {
        left -= finalOverflowRight;
    } else if (finalOverflowLeft > 0) {
        left += finalOverflowLeft;
    }

    return {
        maxWidth,
        top,
        left,
        placement: showAbove ? 'top' : 'bottom',
    };
}
