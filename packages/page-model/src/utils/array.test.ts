import { describe, expect, it } from 'vitest';

import { dedupeBy } from './array';

describe('dedupeBy', () => {
    it('keeps the first item for each key', () => {
        const items = [
            { id: 'a', value: 1 },
            { id: 'b', value: 2 },
            { id: 'a', value: 3 },
        ];

        expect(dedupeBy(items, (item) => item.id)).toEqual([
            { id: 'a', value: 1 },
            { id: 'b', value: 2 },
        ]);
    });

    it('returns all items when keys are unique', () => {
        const items = ['a', 'b', 'c'];

        expect(dedupeBy(items, (item) => item)).toEqual(items);
    });

    it('returns an empty array for empty input', () => {
        expect(dedupeBy([], String)).toEqual([]);
    });
});
