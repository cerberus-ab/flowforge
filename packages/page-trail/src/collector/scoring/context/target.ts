import type { ContainerPathNode } from '../../../types/index.ts';

// constants
const NO_CONTEXT_SCORING_VALUE = 0;
const MAX_BREADCRUMBS_LENGTH = 3;

// Exports

/**
 * Aggregates target container context from the most relevant container path nodes.
 *
 * `relevanceScore` is already pair-specific and already includes distance, target fit,
 * and container meaning. Because of that, context scoring does not apply another
 * distance weighting layer. It selects the top container path nodes by relevance and
 * combines them with a softened noisy-OR:
 *
 * ```text
 * contextScore = 1 - Π(1 - relevanceScore²)
 * ```
 *
 * Squaring each relevance score keeps weak context from inflating the aggregate while
 * still allowing several strong context containers to reinforce each other. If no
 * container context exists, the score is `0`.
 *
 * Breadcrumbs identify the path nodes that contributed to the score. Indexes refer
 * to `TargetContextScoringData.path`, where `0` is the nearest ancestor container,
 * and are returned from rootward to targetward order for semantic breadcrumb display.
 *
 * @returns Normalized context score in the `[0..1]` range and contributing breadcrumb indexes.
 */
export function scoreTargetContext(scoringData: { path: ContainerPathNode[] }): {
    value: number;
    breadcrumbs: number[];
} {
    if (scoringData.path.length === 0)
        return {
            value: NO_CONTEXT_SCORING_VALUE,
            breadcrumbs: [],
        };

    const topN = scoringData.path
        .map((node, i) => ({ relevanceScore: node.relevanceScore, i }))
        .sort((a, b) => b.relevanceScore.value - a.relevanceScore.value)
        .slice(0, MAX_BREADCRUMBS_LENGTH);

    const value = 1 - topN.reduce((product, n) => product * (1 - n.relevanceScore.value ** 2), 1);
    const breadcrumbs = scoringData.path
        .map((_node, i) => i)
        .filter((i) => topN.some((n) => n.i === i))
        .reverse();

    return { value, breadcrumbs };
}
