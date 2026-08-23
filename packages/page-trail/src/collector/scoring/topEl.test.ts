import { describe, expect, it } from 'vitest';

import { contentElement } from '../../../test/fixtures';
import { topElements } from './topEl';

describe('topElements', () => {
    it('sorts elements by importance score in descending order', () => {
        const low = contentElement({ dataId: 'low', importanceScore: { value: 0.1 } });
        const high = contentElement({ dataId: 'high', importanceScore: { value: 0.9 } });
        const medium = contentElement({ dataId: 'medium', importanceScore: { value: 0.5 } });

        const result = topElements([low, high, medium], 0, (el) => el);

        expect(result.data.map((el) => el.dataId)).toEqual(['high', 'medium', 'low']);
    });

    it('returns only the requested number of top elements', () => {
        const result = topElements(
            [
                contentElement({ dataId: 'first', importanceScore: { value: 0.7 } }),
                contentElement({ dataId: 'second', importanceScore: { value: 0.9 } }),
                contentElement({ dataId: 'third', importanceScore: { value: 0.2 } }),
            ],
            2,
            (el) => el,
        );

        expect(result.data.map((el) => el.dataId)).toEqual(['second', 'first']);
        expect(result.total).toBe(3);
        expect(result.limitReached).toBe(true);
    });

    it('does not mark the limit as reached when all elements fit', () => {
        const result = topElements(
            [
                contentElement({ dataId: 'first', importanceScore: { value: 0.7 } }),
                contentElement({ dataId: 'second', importanceScore: { value: 0.9 } }),
            ],
            2,
            (el) => el,
        );

        expect(result.data.map((el) => el.dataId)).toEqual(['second', 'first']);
        expect(result.total).toBe(2);
        expect(result.limitReached).toBe(false);
    });

    it('transforms selected elements after sorting and limiting', () => {
        const result = topElements(
            [
                contentElement({ dataId: 'first', importanceScore: { value: 0.7 } }),
                contentElement({ dataId: 'second', importanceScore: { value: 0.9 } }),
                contentElement({ dataId: 'third', importanceScore: { value: 0.2 } }),
            ],
            2,
            (el) => el.dataId,
        );

        expect(result.data).toEqual(['second', 'first']);
        expect(result.total).toBe(3);
        expect(result.limitReached).toBe(true);
    });
});
