import type { Scoring } from '../types/index.ts';

export function compareByImportanceDesc<T extends { importanceScore: Scoring }>(a: T, b: T): number {
    return b.importanceScore.value - a.importanceScore.value;
}

export function compareByRelevanceDesc<T extends { relevanceScore: Scoring }>(a: T, b: T): number {
    return b.relevanceScore.value - a.relevanceScore.value;
}
