import type { ContainerElement, ElementContext } from '../../types/index.ts';

const SEPARATOR_CONTEXT_PATH = ' > ';

// section Extension, form Checkout, navigation, etc.
function semElementContextPathContainerElement(node: ContainerElement): string {
    if (node.labels.length > 0) {
        return `${node.role} ${node.labels[0]!.value}`;
    }
    return node.role;
}

/**
 * Formats breadcrumb containers into a compact semantic context path.
 *
 * @param context - Element context with full path and selected breadcrumb indexes.
 * @returns Context path, or `undefined` when no breadcrumbs are selected.
 *
 * @example
 * // -> "main content > section Pricing > form Checkout"
 * semElementContext(context)
 */
export function semElementContext(context: ElementContext): string | undefined {
    if (context.breadcrumbs.length > 0) {
        return context.breadcrumbs
            .map((i) => context.path[i])
            .filter(Boolean)
            .map((node) => node!.element)
            .map(semElementContextPathContainerElement)
            .join(SEPARATOR_CONTEXT_PATH);
    }
    return undefined;
}
