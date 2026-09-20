import { describe, expect, it } from 'vitest';

import { compareByImportanceDesc, compareByRelevanceDesc } from './comparator';

describe('comparators', () => {
    it('sorts elements by descending importance score', () => {
        // Given
        const low = { id: 'low', importanceScore: { value: 0.2 } };
        const high = { id: 'high', importanceScore: { value: 0.9 } };
        const medium = { id: 'medium', importanceScore: { value: 0.5 } };

        // When
        const sorted = [low, high, medium].sort(compareByImportanceDesc);

        // Then
        expect(sorted).toEqual([high, medium, low]);
    });

    it('sorts elements by descending relevance score', () => {
        // Given
        const low = { id: 'low', relevanceScore: { value: 0.1 } };
        const high = { id: 'high', relevanceScore: { value: 0.8 } };
        const medium = { id: 'medium', relevanceScore: { value: 0.4 } };

        // When
        const sorted = [medium, low, high].sort(compareByRelevanceDesc);

        // Then
        expect(sorted).toEqual([high, medium, low]);
    });

    it('treats equal importance scores as equal', () => {
        // Given
        const first = { id: 'first', importanceScore: { value: 0.5 } };
        const second = { id: 'second', importanceScore: { value: 0.5 } };

        // When
        const result = compareByImportanceDesc(first, second);

        // Then
        expect(result).toBe(0);
    });
});
