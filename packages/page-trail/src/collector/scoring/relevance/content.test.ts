import { describe, expect, it } from 'vitest';

import type { ContainerRelevanceForContentScoringData } from './content';
import { scoreContainerRelevanceForContentTarget } from './content';

const baseScoringData: ContainerRelevanceForContentScoringData = {
    targetType: 'text',
    containerRole: 'section',
    containerType: 'section',
    containerMeaningScore: 0.7,
    distance: 0,
};

describe('scoreContainerRelevanceForContentTarget', () => {
    it('returns raw score, normalized score, and selected features', () => {
        expect(scoreContainerRelevanceForContentTarget(baseScoringData)).toEqual({
            score: 9,
            value: 11 / 12,
            features: ['CONTAINER_MEANING_STRONG_INC_3', 'DISTANCE_NEAREST_INC_3', 'FIT_STRONG_INC_3'],
        });
    });

    it('scores nearer containers above farther containers', () => {
        expect(scoreContainerRelevanceForContentTarget({ ...baseScoringData, distance: 0 }).value).toBeGreaterThan(
            scoreContainerRelevanceForContentTarget({ ...baseScoringData, distance: 3 }).value,
        );
    });

    it('scores stronger container meaning above weaker container meaning', () => {
        expect(
            scoreContainerRelevanceForContentTarget({
                ...baseScoringData,
                containerMeaningScore: 0.85,
            }).value,
        ).toBeGreaterThan(
            scoreContainerRelevanceForContentTarget({
                ...baseScoringData,
                containerMeaningScore: 0.2,
            }).value,
        );
    });

    it('scores structural containers above navigation widgets for content targets', () => {
        expect(scoreContainerRelevanceForContentTarget(baseScoringData).value).toBeGreaterThan(
            scoreContainerRelevanceForContentTarget({
                ...baseScoringData,
                containerRole: 'navigation',
                containerType: 'navigation',
                containerMeaningScore: 0.7,
            }).value,
        );
    });

    it('keeps heading relevance in navigation weaker than structural content scope', () => {
        expect(
            scoreContainerRelevanceForContentTarget({
                ...baseScoringData,
                targetType: 'heading',
                containerRole: 'navigation',
                containerType: 'navigation',
                containerMeaningScore: 0.7,
            }).features,
        ).toEqual(['CONTAINER_MEANING_STRONG_INC_3', 'DISTANCE_NEAREST_INC_3', 'FIT_MEDIUM_INC_1']);
    });

    it('penalizes noisy context scopes', () => {
        expect(
            scoreContainerRelevanceForContentTarget({
                ...baseScoringData,
                containerRole: 'footer',
                containerType: 'landmark',
                containerMeaningScore: 0.7,
            }).features,
        ).toContain('FIT_WEAK_DEC_2');
    });
});
