import type { BaseElement } from '../../types/index.ts';

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
export function topElements<T extends BaseElement>(elements: T[], limit: number): TopElements<T> {
    const sorted = [...elements].sort((a, b) => b.importanceScore - a.importanceScore);

    if (limit === 0) {
        return {
            data: sorted,
            total: sorted.length,
            limitReached: false,
        };
    }
    return {
        data: sorted.slice(0, limit),
        total: sorted.length,
        limitReached: sorted.length > limit,
    };
}
