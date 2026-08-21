import { describe, expect, it } from 'vitest';

import type { ContainerMeaningScoringData } from './container';
import { scoreContainerMeaning } from './container';

const baseScoringData: ContainerMeaningScoringData = {
    role: 'section',
    type: 'section',
    labels: [],
    bbox: { top: 0, left: 0, width: 100, height: 100, right: 100, bottom: 100 },
};

describe('scoreContainerMeaning', () => {
    it('returns a normalized score', () => {
        const score = scoreContainerMeaning(baseScoringData);

        expect(score.value).toBeGreaterThanOrEqual(0);
        expect(score.value).toBeLessThanOrEqual(1);
    });

    it('scores strong context scopes above generic sections', () => {
        expect(scoreContainerMeaning({ ...baseScoringData, role: 'form', type: 'form' }).value).toBeGreaterThan(
            scoreContainerMeaning(baseScoringData).value,
        );
    });

    it('scores labeled containers above unlabeled containers', () => {
        expect(
            scoreContainerMeaning({
                ...baseScoringData,
                labels: [{ source: 'aria-label', value: 'Payment details' }],
            }).value,
        ).toBeGreaterThan(scoreContainerMeaning(baseScoringData).value);
    });

    it('scores strong label sources above subheadings and title-only labels', () => {
        const strongLabelScore = scoreContainerMeaning({
            ...baseScoringData,
            labels: [{ source: 'heading', value: 'Payment details' }],
        }).value;
        const subheadingLabelScore = scoreContainerMeaning({
            ...baseScoringData,
            labels: [{ source: 'subheading', value: 'Payment details' }],
        }).value;
        const titleLabelScore = scoreContainerMeaning({
            ...baseScoringData,
            labels: [{ source: 'title', value: 'Payment details' }],
        }).value;

        expect(strongLabelScore).toBeGreaterThan(subheadingLabelScore);
        expect(subheadingLabelScore).toBeGreaterThan(titleLabelScore);
    });

    it('scores strong label sources above title-only labels', () => {
        expect(
            scoreContainerMeaning({
                ...baseScoringData,
                labels: [{ source: 'heading', value: 'Payment details' }],
            }).value,
        ).toBeGreaterThan(
            scoreContainerMeaning({
                ...baseScoringData,
                labels: [{ source: 'title', value: 'Payment details' }],
            }).value,
        );
    });

    it('scores focused container types above supporting container types', () => {
        expect(scoreContainerMeaning({ ...baseScoringData, role: 'dialog', type: 'dialog' }).value).toBeGreaterThan(
            scoreContainerMeaning({ ...baseScoringData, role: 'table', type: 'table' }).value,
        );
    });

    it('uses type as a fallback structural signal when roles have similar strength', () => {
        expect(
            scoreContainerMeaning({ ...baseScoringData, role: 'navigation', type: 'navigation' }).value,
        ).toBeGreaterThan(scoreContainerMeaning({ ...baseScoringData, role: 'toolbar', type: 'widget' }).value);
    });

    it('returns raw score together with the normalized score', () => {
        const score = scoreContainerMeaning({ ...baseScoringData, role: 'form', type: 'form' });

        expect(score.score).toBe(8);
        expect(score.value).toBeCloseTo(14 / 18);
    });

    it('normalizes weak unlabeled granular containers to the lower end of the range', () => {
        const score = scoreContainerMeaning({
            ...baseScoringData,
            role: 'table row',
            type: 'table',
        });

        expect(score.score).toBe(-2);
        expect(score.value).toBeCloseTo(4 / 18);
    });

    it('normalizes an omitted label score as neutral for roles that do not require labels', () => {
        const score = scoreContainerMeaning({
            ...baseScoringData,
            role: 'main content',
            type: 'landmark',
        });

        expect(score.score).toBe(7);
        expect(score.value).toBeCloseTo(13 / 18);
    });

    it('returns scoring features in weight declaration order', () => {
        expect(
            scoreContainerMeaning({
                ...baseScoringData,
                role: 'form',
                type: 'form',
                labels: [{ source: 'legend', value: 'Payment details' }],
                bbox: { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 },
            }).features,
        ).toEqual(['TYPE_FOCUSED_INC_3', 'ROLE_CRITICAL_INC_5', 'LABEL_STRONG_INC_4', 'SIZE_TOO_SMALL_DEC_3']);
    });

    it('returns title-only label diagnostics separately from strong labels', () => {
        expect(
            scoreContainerMeaning({
                ...baseScoringData,
                labels: [{ source: 'title', value: 'Payment details' }],
            }).features,
        ).toEqual(expect.arrayContaining(['TYPE_STRUCTURAL_INC_2', 'ROLE_MEANINGFUL_INC_3', 'LABEL_TITLE_ONLY_INC_2']));
    });

    it('returns subheading label diagnostics separately from strong and title-only labels', () => {
        expect(
            scoreContainerMeaning({
                ...baseScoringData,
                labels: [{ source: 'subheading', value: 'Payment details' }],
            }).features,
        ).toEqual(expect.arrayContaining(['TYPE_STRUCTURAL_INC_2', 'ROLE_MEANINGFUL_INC_3', 'LABEL_SUBHEADING_INC_3']));
    });

    it('penalizes weak and noisy containers without making every noisy scope useless by itself', () => {
        expect(scoreContainerMeaning({ ...baseScoringData, role: 'footer', type: 'landmark' }).value).toBeLessThan(
            scoreContainerMeaning({ ...baseScoringData, role: 'main content', type: 'landmark' }).value,
        );

        expect(scoreContainerMeaning({ ...baseScoringData, role: 'footer', type: 'landmark' }).value).toBeGreaterThan(
            0,
        );

        expect(scoreContainerMeaning({ ...baseScoringData, role: 'table row', type: 'table' }).value).toBeLessThan(
            scoreContainerMeaning({ ...baseScoringData, role: 'table', type: 'table' }).value,
        );
    });

    it('penalizes very small containers', () => {
        expect(
            scoreContainerMeaning({
                ...baseScoringData,
                bbox: { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 },
            }).value,
        ).toBeLessThan(scoreContainerMeaning(baseScoringData).value);
    });
});
