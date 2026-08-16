import { describe, expect, it } from 'vitest';

import { getMaxImportanceScore, getMinImportanceScore, normalizeImportanceScore, readContextPath } from './utils';

describe('importance utils', () => {
    it('calculates min and max scores from weights', () => {
        const weights = { positive: 3, neutral: 0, negative: -2 };

        expect(getMinImportanceScore(weights)).toBe(-2);
        expect(getMaxImportanceScore(weights)).toBe(3);
    });

    it('normalizes scores into the 0..1 range', () => {
        expect(normalizeImportanceScore(-10, 0, 10)).toBe(0);
        expect(normalizeImportanceScore(20, 0, 10)).toBe(1);
        expect(normalizeImportanceScore(5, 0, 10)).toBe(0.5);
    });

    it('reads context flags from container roles', () => {
        expect(readContextPath(['main content', 'modal dialog', 'navigation', 'footer'])).toEqual({
            inMain: true,
            inDialog: true,
            inFooter: true,
            inNav: true,
        });
    });

    it('returns false flags for empty context', () => {
        expect(readContextPath([])).toEqual({
            inMain: false,
            inDialog: false,
            inFooter: false,
            inNav: false,
        });
    });
});
