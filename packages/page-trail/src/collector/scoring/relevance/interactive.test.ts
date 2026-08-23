import { describe, expect, it } from 'vitest';

import type { ContainerRelevanceForInteractiveTargetScoringData } from './interactive';
import { scoreContainerRelevanceForInteractiveTarget } from './interactive';

const baseScoringData: ContainerRelevanceForInteractiveTargetScoringData = {
    targetRole: 'button',
    targetType: 'button',
    containerRole: 'form',
    containerType: 'form',
    containerMeaningScore: 0.7,
    distance: 0,
};

describe('scoreContainerRelevanceForInteractiveTarget', () => {
    it('returns raw score, normalized score, and selected features', () => {
        expect(scoreContainerRelevanceForInteractiveTarget(baseScoringData)).toEqual({
            score: 9,
            value: 11 / 12,
            features: ['CONTAINER_MEANING_STRONG_INC_3', 'DISTANCE_NEAREST_INC_3', 'FIT_STRONG_INC_3'],
        });
    });

    it('scores nearer containers above farther containers', () => {
        expect(scoreContainerRelevanceForInteractiveTarget({ ...baseScoringData, distance: 0 }).value).toBeGreaterThan(
            scoreContainerRelevanceForInteractiveTarget({ ...baseScoringData, distance: 3 }).value,
        );
    });

    it('scores stronger container meaning above weaker container meaning', () => {
        expect(
            scoreContainerRelevanceForInteractiveTarget({
                ...baseScoringData,
                containerMeaningScore: 0.85,
            }).value,
        ).toBeGreaterThan(
            scoreContainerRelevanceForInteractiveTarget({
                ...baseScoringData,
                containerMeaningScore: 0.2,
            }).value,
        );
    });

    it('scores form context above generic section context for interactive targets', () => {
        expect(scoreContainerRelevanceForInteractiveTarget(baseScoringData).value).toBeGreaterThan(
            scoreContainerRelevanceForInteractiveTarget({
                ...baseScoringData,
                containerRole: 'section',
                containerType: 'section',
                containerMeaningScore: 0.7,
            }).value,
        );
    });

    it('scores navigation context as strong for interactive targets', () => {
        expect(
            scoreContainerRelevanceForInteractiveTarget({
                ...baseScoringData,
                targetRole: 'link',
                targetType: 'link',
                containerRole: 'navigation',
                containerType: 'navigation',
                containerMeaningScore: 0.7,
            }).features,
        ).toEqual(['CONTAINER_MEANING_STRONG_INC_3', 'DISTANCE_NEAREST_INC_3', 'FIT_STRONG_INC_3']);
    });

    it('scores search containers as strong context for search inputs', () => {
        expect(
            scoreContainerRelevanceForInteractiveTarget({
                ...baseScoringData,
                targetRole: 'searchbox',
                targetType: 'input',
                containerRole: 'search',
                containerType: 'landmark',
                containerMeaningScore: 0.7,
            }).features,
        ).toEqual(['CONTAINER_MEANING_STRONG_INC_3', 'DISTANCE_NEAREST_INC_3', 'FIT_STRONG_INC_3']);
    });

    it('penalizes noisy context scopes', () => {
        expect(
            scoreContainerRelevanceForInteractiveTarget({
                ...baseScoringData,
                containerRole: 'footer',
                containerType: 'landmark',
                containerMeaningScore: 0.7,
            }).features,
        ).toContain('FIT_WEAK_DEC_2');
    });
});
