import type { Scoring } from '../../types/index.ts';

export interface TopElements<T> {
    data: T[];
    total: number;
    limitReached: boolean;
}

/**
 * Selects the highest-ranked elements by importance score up to the specified limit,
 * while preserving their original order.
 *
 * A limit of `0` returns all elements without truncation.
 */
export function topElements<S extends { importanceScore: Scoring }, T>(
    elements: S[],
    limit: number,
    transform: (element: S) => T,
): TopElements<T> {
    if (limit === 0 || elements.length <= limit) {
        return {
            data: elements.map(transform),
            total: elements.length,
            limitReached: false,
        };
    }

    const top = new Set(
        [...elements].sort((a, b) => b.importanceScore.value - a.importanceScore.value).slice(0, limit),
    );
    return {
        data: elements.filter((element) => top.has(element)).map(transform),
        total: elements.length,
        limitReached: true,
    };
}
