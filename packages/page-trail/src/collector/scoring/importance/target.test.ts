import { describe, expect, it } from 'vitest';

import type { TargetImportanceScoringData } from './target';
import { scoreTargetImportance } from './target';

const baseScoringData: TargetImportanceScoringData = {
    meaningScore: { value: 0.8 },
    contextScore: { value: 0.5 },
};

describe('scoreTargetImportance', () => {
    it('applies context as a gated boost to target meaning', () => {
        expect(scoreTargetImportance(baseScoringData)).toEqual({
            value: 0.8 * (0.7 + 0.3 * 0.5),
        });
    });

    it('returns zero for meaningless targets even with perfect context', () => {
        expect(
            scoreTargetImportance({
                meaningScore: { value: 0 },
                contextScore: { value: 1 },
            }),
        ).toEqual({ value: 0 });
    });

    it('keeps standalone target meaning partially ranked when context is absent', () => {
        expect(
            scoreTargetImportance({
                meaningScore: { value: 0.8 },
                contextScore: { value: 0 },
            }),
        ).toEqual({ value: 0.8 * 0.7 });
    });

    it('returns full meaning score when context is perfect', () => {
        expect(
            scoreTargetImportance({
                meaningScore: { value: 0.8 },
                contextScore: { value: 1 },
            }),
        ).toEqual({ value: 0.8 });
    });

    it('does not let strong context overpower weak target meaning', () => {
        expect(
            scoreTargetImportance({
                meaningScore: { value: 0.2 },
                contextScore: { value: 1 },
            }).value,
        ).toBe(0.2);
    });

    it('increases monotonically with context score for the same target meaning', () => {
        const weakContext = scoreTargetImportance({
            ...baseScoringData,
            contextScore: { value: 0.2 },
        });
        const strongContext = scoreTargetImportance({
            ...baseScoringData,
            contextScore: { value: 0.9 },
        });

        expect(strongContext.value).toBeGreaterThan(weakContext.value);
    });

    it('increases monotonically with meaning score for the same context score', () => {
        const weakMeaning = scoreTargetImportance({
            ...baseScoringData,
            meaningScore: { value: 0.2 },
        });
        const strongMeaning = scoreTargetImportance({
            ...baseScoringData,
            meaningScore: { value: 0.9 },
        });

        expect(strongMeaning.value).toBeGreaterThan(weakMeaning.value);
    });
});
