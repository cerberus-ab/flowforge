import { describe, expect, it } from 'vitest';

import { ScoringFeat } from './ScoringFeat';

const scoring = ScoringFeat.create({
    role: {
        critical: 4,
        strong: 3,
        neutral: 0,
        noisy: -1,
    },
    label: {
        strong: 5,
        titleOnly: 4,
        genericUnlabeled: -2,
    },
    sizeTooSmall: -4,
    hasVisibleText: 2,
    noImpact: 0,
} as const);

describe('ScoringFeat', () => {
    it('sums selected categorical and boolean feature weights', () => {
        expect(
            scoring.score({
                role: 'critical',
                label: 'strong',
                hasVisibleText: true,
            }),
        ).toBe(11);
    });

    it('does not apply boolean feature weights for false selections', () => {
        expect(
            scoring.score({
                role: 'strong',
                sizeTooSmall: false,
                hasVisibleText: false,
            }),
        ).toBe(3);
    });

    it('applies negative categorical and boolean weights', () => {
        expect(
            scoring.score({
                role: 'noisy',
                label: 'genericUnlabeled',
                sizeTooSmall: true,
            }),
        ).toBe(-7);
    });

    it('ignores omitted features', () => {
        expect(scoring.score({})).toBe(0);
    });

    it('ignores unknown runtime keys, categories, and mismatched values', () => {
        expect(
            scoring.score({
                role: 'unknown',
                label: true,
                sizeTooSmall: 'yes',
                unknownFeature: 'strong',
            } as never),
        ).toBe(0);
    });

    it('normalizes the weakest configured score to 0', () => {
        expect(
            scoring.value({
                role: 'noisy',
                label: 'genericUnlabeled',
                sizeTooSmall: true,
            }),
        ).toBe(0);
    });

    it('normalizes the strongest configured score to 1', () => {
        expect(
            scoring.value({
                role: 'critical',
                label: 'strong',
                hasVisibleText: true,
            }),
        ).toBe(1);
    });

    it('normalizes intermediate scores within the inferred score range', () => {
        expect(
            scoring.value({
                role: 'strong',
            }),
        ).toBeCloseTo(10 / 18);
    });

    it('lists selected feature names with categories and signed weight suffixes', () => {
        expect(
            scoring.features({
                role: 'critical',
                label: 'genericUnlabeled',
                sizeTooSmall: true,
                hasVisibleText: true,
            }),
        ).toEqual([
            'ROLE_CRITICAL_INC_4',
            'LABEL_GENERIC_UNLABELED_DEC_2',
            'SIZE_TOO_SMALL_DEC_4',
            'HAS_VISIBLE_TEXT_INC_2',
        ]);
    });

    it('does not list false boolean features', () => {
        expect(
            scoring.features({
                role: 'strong',
                sizeTooSmall: false,
                hasVisibleText: false,
            }),
        ).toEqual(['ROLE_STRONG_INC_3']);
    });

    it('does not list selected features with zero weight', () => {
        expect(
            scoring.features({
                role: 'neutral',
                noImpact: true,
            }),
        ).toEqual([]);
    });

    it('ignores unknown runtime keys, categories, and mismatched values when listing feature names', () => {
        expect(
            scoring.features({
                role: 'unknown',
                label: true,
                sizeTooSmall: 'yes',
                unknownFeature: 'strong',
            } as never),
        ).toEqual([]);
    });

    it('returns raw score, normalized score, and diagnostic features from calc', () => {
        expect(
            scoring.calc({
                role: 'critical',
                label: 'strong',
                hasVisibleText: true,
            }),
        ).toEqual({
            score: 11,
            value: 1,
            features: ['ROLE_CRITICAL_INC_4', 'LABEL_STRONG_INC_5', 'HAS_VISIBLE_TEXT_INC_2'],
        });
    });

    it('uses the same invalid runtime selection semantics in calc', () => {
        expect(
            scoring.calc({
                role: 'unknown',
                label: true,
                sizeTooSmall: 'yes',
                unknownFeature: 'strong',
            } as never),
        ).toEqual({
            score: 0,
            value: 7 / 18,
            features: [],
        });
    });
});
