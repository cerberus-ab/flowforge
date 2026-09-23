import { describe, expect, it } from 'vitest';

import { createContentElementFixture } from '../../../test/fixtures';
import { topElements } from './topEl';

describe('topElements', () => {
    it('returns all elements in their original order when unlimited', () => {
        const low = createContentElementFixture({ id: 0, importanceScore: { value: 0.1 } });
        const high = createContentElementFixture({ id: 1, importanceScore: { value: 0.9 } });
        const medium = createContentElementFixture({ id: 2, importanceScore: { value: 0.5 } });

        const result = topElements([low, high, medium], 0, (el) => el);

        expect(result.data.map((el) => el.id)).toEqual([0, 1, 2]);
    });

    it('returns only the requested number of top elements', () => {
        const result = topElements(
            [
                createContentElementFixture({ id: 0, importanceScore: { value: 0.7 } }),
                createContentElementFixture({ id: 1, importanceScore: { value: 0.9 } }),
                createContentElementFixture({ id: 2, importanceScore: { value: 0.2 } }),
            ],
            2,
            (el) => el,
        );

        expect(result.data.map((el) => el.id)).toEqual([0, 1]);
        expect(result.total).toBe(3);
        expect(result.limitReached).toBe(true);
    });

    it('does not mark the limit as reached when all elements fit', () => {
        const result = topElements(
            [
                createContentElementFixture({ id: 0, importanceScore: { value: 0.7 } }),
                createContentElementFixture({ id: 1, importanceScore: { value: 0.9 } }),
            ],
            2,
            (el) => el,
        );

        expect(result.data.map((el) => el.id)).toEqual([0, 1]);
        expect(result.total).toBe(2);
        expect(result.limitReached).toBe(false);
    });

    it('transforms selected elements after sorting and limiting', () => {
        const result = topElements(
            [
                createContentElementFixture({ id: 0, importanceScore: { value: 0.7 } }),
                createContentElementFixture({ id: 1, importanceScore: { value: 0.9 } }),
                createContentElementFixture({ id: 2, importanceScore: { value: 0.2 } }),
            ],
            2,
            (el) => el.id,
        );

        expect(result.data).toEqual([0, 1]);
        expect(result.total).toBe(3);
        expect(result.limitReached).toBe(true);
    });
});
