import { describe, expect, it } from 'vitest';

import { interactiveElement } from '../../../test/fixtures';
import { scoreInteractiveElement } from './interactive';

describe('scoreInteractiveElement', () => {
    it('returns a normalized score', () => {
        const score = scoreInteractiveElement(interactiveElement());

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    });

    it('scores labeled elements above unlabeled elements', () => {
        const labeled = interactiveElement({
            labels: [{ source: 'aria-label', value: 'Submit form' }],
            text: undefined,
        });
        const unlabeled = interactiveElement({ text: undefined });

        expect(scoreInteractiveElement(labeled)).toBeGreaterThan(scoreInteractiveElement(unlabeled));
    });

    it('scores critical controls above plain links', () => {
        expect(scoreInteractiveElement(interactiveElement({ role: 'button', type: 'button' }))).toBeGreaterThan(
            scoreInteractiveElement(interactiveElement({ role: 'link', type: 'link' })),
        );
    });

    it('penalizes disabled or hidden elements', () => {
        expect(scoreInteractiveElement(interactiveElement({ state: { disabled: true } }))).toBeLessThan(
            scoreInteractiveElement(interactiveElement()),
        );
        expect(scoreInteractiveElement(interactiveElement({ state: { hidden: true } }))).toBeLessThan(
            scoreInteractiveElement(interactiveElement()),
        );
    });

    it('penalizes very small targets', () => {
        const small = interactiveElement({
            bbox: { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 },
        });

        expect(scoreInteractiveElement(small)).toBeLessThan(scoreInteractiveElement(interactiveElement()));
    });

    it('scores main context above footer context', () => {
        expect(scoreInteractiveElement(interactiveElement({ context: { path: ['main content'] } }))).toBeGreaterThan(
            scoreInteractiveElement(interactiveElement({ context: { path: ['footer'] } })),
        );
    });
});
