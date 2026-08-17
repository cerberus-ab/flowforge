import type { Scoring } from '../../../types/index.ts';

// constants
const BASE_MEANING_WEIGHT = 0.7;
const CONTEXT_BOOST_WEIGHT = 0.3;

// Exports

export interface TargetImportanceScoringData {
    meaningScore: Scoring;
    contextScore: Scoring;
}

/**
 * Computes the final ranking score for a target element from standalone meaning
 * and aggregated container context.
 *
 * `meaningScore` acts as the gate: context can boost a meaningful target, but it
 * cannot make an otherwise meaningless target important by itself. With no useful
 * context, the target keeps its base standalone meaning weight. With perfect
 * context, the score reaches the full `meaningScore`.
 *
 * ```text
 * importanceScore = meaningScore * (BASE_MEANING_WEIGHT + CONTEXT_BOOST_WEIGHT * contextScore)
 * ```
 *
 * @returns Normalized target importance score in the `[0..1]` range.
 */
export function scoreTargetImportance(scoringData: TargetImportanceScoringData): { value: number } {
    return {
        value:
            scoringData.meaningScore.value *
            (BASE_MEANING_WEIGHT + CONTEXT_BOOST_WEIGHT * scoringData.contextScore.value),
    };
}
