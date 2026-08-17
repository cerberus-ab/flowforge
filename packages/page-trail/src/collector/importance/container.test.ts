import { describe, expect, it } from 'vitest';

import type { ContainerElementBaseScoringData } from './container';
import { scoreBaseContainerElement } from './container';

const baseScoringData: ContainerElementBaseScoringData = {
    role: 'section',
    type: 'section',
    labels: [],
    bbox: { top: 0, left: 0, width: 100, height: 100, right: 100, bottom: 100 },
};

describe('scoreBaseContainerElement', () => {
    it('returns a normalized score', () => {
        const score = scoreBaseContainerElement(baseScoringData);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    });

    it('scores strong semantic scopes above generic sections', () => {
        expect(scoreBaseContainerElement({ ...baseScoringData, role: 'form', type: 'form' })).toBeGreaterThan(
            scoreBaseContainerElement(baseScoringData),
        );
    });

    it('scores labeled containers above unlabeled containers', () => {
        expect(
            scoreBaseContainerElement({
                ...baseScoringData,
                labels: [{ source: 'aria-label', value: 'Payment details' }],
            }),
        ).toBeGreaterThan(scoreBaseContainerElement(baseScoringData));
    });

    it('scores strong label sources above title-only labels', () => {
        expect(
            scoreBaseContainerElement({
                ...baseScoringData,
                labels: [{ source: 'heading', value: 'Payment details' }],
            }),
        ).toBeGreaterThan(
            scoreBaseContainerElement({
                ...baseScoringData,
                labels: [{ source: 'title', value: 'Payment details' }],
            }),
        );
    });

    it('penalizes noisy containers', () => {
        expect(scoreBaseContainerElement({ ...baseScoringData, role: 'footer', type: 'landmark' })).toBeLessThan(
            scoreBaseContainerElement({ ...baseScoringData, role: 'main content', type: 'landmark' }),
        );

        expect(scoreBaseContainerElement({ ...baseScoringData, role: 'table row', type: 'table' })).toBeLessThan(
            scoreBaseContainerElement({ ...baseScoringData, role: 'table', type: 'table' }),
        );
    });

    it('penalizes very small containers', () => {
        expect(
            scoreBaseContainerElement({
                ...baseScoringData,
                bbox: { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 },
            }),
        ).toBeLessThan(scoreBaseContainerElement(baseScoringData));
    });
});
