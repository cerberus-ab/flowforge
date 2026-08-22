import type { ContainerElement, ElementContext } from '../../types/index.ts';
import { semContainerElement } from './container.ts';

const SEPARATOR_CONTEXT_PATH = ' > ';

// section Extension, form Checkout, navigation, etc.
function semElementContextShortPathContainerElement(node: ContainerElement): string {
    if (node.labels.length > 0) {
        return `${node.role} ${node.labels[0]!.value}`;
    }
    return node.role;
}

/**
 * Formats breadcrumb containers into a compact semantic context path.
 *
 * @param context - Element context with full path and selected breadcrumb indexes.
 * @returns Short context path, or `undefined` when no breadcrumbs are selected.
 *
 * @example
 * // -> "main content > section Pricing > form Checkout"
 * semElementContextShort(context)
 */
export function semElementContextShort(context: ElementContext): string | undefined {
    if (context.breadcrumbs.length > 0) {
        return context.breadcrumbs
            .map((i) => context.path[i])
            .filter(Boolean)
            .map((node) => node!.element)
            .map(semElementContextShortPathContainerElement)
            .join(SEPARATOR_CONTEXT_PATH);
    }
    return undefined;
}

/**
 * Formats selected breadcrumb containers as full semantic records.
 *
 * Uses the same breadcrumb indexes as `semElementContextShort`, but preserves
 * the complete container semantic text for each breadcrumb.
 *
 * @param context - Element context with full path and selected breadcrumb indexes.
 * @returns Full container records for valid breadcrumb indexes.
 *
 * @example
 * // -> ["Main content", "Section. Name: Pricing", "Form. Name: Checkout"]
 * semElementContextPathBreadcrumbs(context)
 */
export function semElementContextByBreadcrumbs(context: ElementContext): string[] {
    return context.breadcrumbs
        .map((i) => context.path[i])
        .filter(Boolean)
        .map((node) => semContainerElement(node!.element).text());
}
