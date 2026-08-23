import type { ElementContext } from '../../types/index.ts';
import type { ContainerTree, ContentTargetForPath, InteractiveTargetForPath } from './ContainerTree.ts';
import { scoreTargetContext } from '../scoring/index.ts';

/**
 * Extracts semantic ancestor context for a content element.
 *
 * The returned context keeps the full container path, exposes only the numeric
 * context score used by target importance scoring, and carries breadcrumb
 * indexes for the strongest context containers.
 */
export function extractContentElementContext(
    containerTree: ContainerTree,
    el: Element,
    target: ContentTargetForPath,
): ElementContext {
    const path = containerTree.getContentTargetPath(el, target);
    const { value, breadcrumbs } = scoreTargetContext({ path });
    return { path, breadcrumbs, contextScore: { value } };
}

/**
 * Extracts semantic ancestor context for an interactive element.
 *
 * The returned context keeps the full container path, exposes only the numeric
 * context score used by target importance scoring, and carries breadcrumb
 * indexes for the strongest context containers.
 */
export function extractInteractiveElementContext(
    containerTree: ContainerTree,
    el: Element,
    target: InteractiveTargetForPath,
): ElementContext {
    const path = containerTree.getInteractiveTargetPath(el, target);
    const { value, breadcrumbs } = scoreTargetContext({ path });
    return { path, breadcrumbs, contextScore: { value } };
}
