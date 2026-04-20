import { normalizeText } from '#self/core/utils/text';
import { getElementAttrAriaLabelledBy } from './primitive/label';
import type { ContainerElementRole, ElementContext } from '@flowforge/shared';
import { getContainerRole } from './primitive/role';
import { constants } from '#self/constants';

function isGoodContextSectionName(text: string): boolean {
    return (
        text.length >= constants.CONTEXT_SECTION_NAME_MIN_LENGTH &&
        text.length <= constants.CONTEXT_SECTION_NAME_MAX_LENGTH
    );
}

/**
 * Builds a semantic container path for an element by walking up its ancestors.
 *
 * Traversal starts from the immediate parent of `el` and continues upward until
 * either `maxDepth` is reached or `maxItems` roles have been collected.
 * Consecutive duplicate roles are ignored.
 *
 * @param el - Target element whose ancestor container roles are collected.
 * @param maxDepth - Maximum ancestor levels to inspect. Defaults to `CONTEXT_PATH_HOIST_DEPTH`.
 * @param maxItems - Maximum number of roles to include in the returned path. Defaults to `CONTEXT_PATH_ITEMS_LIMIT`.
 * @returns Ordered list of container roles found from nearest to farthest ancestor.
 */
function getElementContextPath(
    el: Element,
    maxDepth = constants.CONTEXT_PATH_HOIST_DEPTH,
    maxItems = constants.CONTEXT_PATH_ITEMS_LIMIT,
): ContainerElementRole[] {
    const path: ContainerElementRole[] = [];
    let current: Element | null = el.parentElement;
    let depth = 0;

    while (current && depth < maxDepth) {
        const name = getContainerRole(current);

        if (name && path[path.length - 1] !== name) {
            path.push(name);
            if (path.length >= maxItems) break;
        }
        current = current.parentElement;
        depth += 1;
    }
    return path;
}

/**
 * Finds a contextual section name for an element by traversing ancestor elements.
 *
 * The search starts at the immediate parent and continues upward until `maxDepth`
 * is reached. At each ancestor, candidates are checked in this order:
 * 1. `aria-labelledby`
 * 2. `aria-label`
 * 3. first `legend` descendant
 * 4. first heading descendant (`h1`-`h6` or `[role="heading"]`)
 * 5. `title`
 *
 * A candidate is returned only if it satisfies the section name length constraints
 * defined by `isGoodContextSectionName`.
 *
 * @param el - Target element whose ancestor context should be inspected.
 * @param doc - Document containing the target element.
 * @param maxDepth - Maximum number of ancestor levels to traverse. Defaults to `CONTEXT_HOIST_DEPTH`.
 * @returns The first valid section name found, or `undefined` if none is found within the depth limit.
 */
function getElementContextSectionName(
    el: Element,
    doc: Document,
    maxDepth = constants.CONTEXT_SECTION_NAME_HOIST_DEPTH,
): string | undefined {
    let current: Element | null = el.parentElement;
    let depth = 0;

    while (current && depth < maxDepth) {
        // 1. aria-labelledby
        const ariaLabelledBy = getElementAttrAriaLabelledBy(current, doc);
        if (ariaLabelledBy) {
            if (isGoodContextSectionName(ariaLabelledBy)) return ariaLabelledBy;
        }
        // 2. aria-label
        const ariaLabel = normalizeText(current.getAttribute('aria-label') ?? '');
        if (isGoodContextSectionName(ariaLabel)) return ariaLabel;
        // 3. legend
        const legend = current.querySelector('legend');
        if (legend && legend !== el) {
            const legendText = normalizeText(legend.textContent ?? '');
            if (isGoodContextSectionName(legendText)) return legendText;
        }
        // 4. heading
        const heading = current.querySelector('h1, h2, h3, h4, h5, h6, [role="heading"]');
        if (heading && heading !== el) {
            const headingText = normalizeText(heading.textContent ?? '');
            if (isGoodContextSectionName(headingText)) return headingText;
        }
        // 5. title
        const title = normalizeText(current.getAttribute('title') ?? '');
        if (isGoodContextSectionName(title)) return title;

        current = current.parentElement;
        depth += 1;
    }
    return undefined;
}

/**
 * Gets contextual metadata for an element, including semantic container path
 * and nearest valid section name from ancestor elements.
 *
 * @param el - Target element to extract context for.
 * @param doc - Document containing the target element.
 * @returns Context object containing `path` and optional `sectionName`.
 */
export function getElementContext(el: Element, doc: Document): ElementContext {
    return {
        path: getElementContextPath(el),
        sectionName: getElementContextSectionName(el, doc),
    };
}
