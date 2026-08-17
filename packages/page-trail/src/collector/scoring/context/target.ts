import type { ContainerPathNode } from '../../../types/index.ts';

// constants
const NO_CONTEXT_SCORING_VALUE = 0;
const TOP_N_CONTAINER_NODES = 3;

// Exports

export interface TargetContextScoringData {
    path: ContainerPathNode[];
}

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
 * @returns Normalized context score in the `[0..1]` range.
 */
export function scoreTargetContext(scoringData: TargetContextScoringData): { value: number } {
    if (scoringData.path.length === 0) return { value: NO_CONTEXT_SCORING_VALUE };

    const topN = [...scoringData.path]
        .sort((a, b) => b.relevanceScore.value - a.relevanceScore.value)
        .slice(0, TOP_N_CONTAINER_NODES);

    const value = 1 - topN.reduce((product, node) => product * (1 - node.relevanceScore.value ** 2), 1);

    return { value };
}
