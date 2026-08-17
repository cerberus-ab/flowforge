import type { Scoring } from '../../types/index.ts';

export interface TopElements<T> {
    data: T[];
    total: number;
    limitReached: boolean;
}

/**
 * Sorts elements by importance score in descending order and returns
 * the highest-ranked elements up to the specified limit.
 *
 * A limit of `0` returns all elements without truncation.
 */
export function topElements<S extends { importanceScore: Scoring }, T>(
    elements: S[],
    limit: number,
    transform: (element: S) => T,
): TopElements<T> {
    const sorted = [...elements].sort((a, b) => b.importanceScore.value - a.importanceScore.value);

    if (limit === 0) {
        return {
            data: sorted.map(transform),
            total: sorted.length,
            limitReached: false,
        };
    }
    return {
        data: sorted.slice(0, limit).map(transform),
        total: sorted.length,
        limitReached: sorted.length > limit,
    };
}
