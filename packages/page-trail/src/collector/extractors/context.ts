import type { ContainerPathNode, ContentElement, ElementContext, InteractiveElement } from '../../types/index.ts';
import type { ContainerTree } from './ContainerTree.ts';
import {
    scoreContainerRelevanceForContentTarget,
    scoreContainerRelevanceForInteractiveTarget,
    scoreTargetContext,
} from '../scoring/index.ts';

export type ContentTargetForPath = Pick<ContentElement, 'type'>;
export type InteractiveTargetForPath = Pick<InteractiveElement, 'role' | 'type'>;

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
    const path: ContainerPathNode[] = containerTree.getPathToRoot(el).map((container, distance) => ({
        distance,
        container: container,
        relevanceScore: scoreContainerRelevanceForContentTarget({
            targetType: target.type,
            containerRole: container.role,
            containerType: container.type,
            containerMeaningScore: container.meaningScore.value,
            distance,
        }),
    }));
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
    const path: ContainerPathNode[] = containerTree.getPathToRoot(el).map((container, distance) => ({
        distance,
        container,
        relevanceScore: scoreContainerRelevanceForInteractiveTarget({
            targetRole: target.role,
            targetType: target.type,
            containerRole: container.role,
            containerType: container.type,
            containerMeaningScore: container.meaningScore.value,
            distance,
        }),
    }));
    const { value, breadcrumbs } = scoreTargetContext({ path });
    return { path, breadcrumbs, contextScore: { value } };
}
