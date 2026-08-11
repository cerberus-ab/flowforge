import { describe, expect, it } from 'vitest';

import { contentElement } from '../../../test/fixtures';
import { scoreContentElement } from './content';

describe('scoreContentElement', () => {
    it('returns a normalized score', () => {
        const score = scoreContentElement(contentElement());

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    });

    it('scores headings above regular text', () => {
        expect(scoreContentElement(contentElement({ type: 'heading' }))).toBeGreaterThan(
            scoreContentElement(contentElement()),
        );
    });

    it('scores main named sections above navigation content', () => {
        const main = contentElement({
            context: { path: ['main content'], sectionName: 'Pricing' },
        });
        const nav = contentElement({
            context: { path: ['navigation'] },
        });

        expect(scoreContentElement(main)).toBeGreaterThan(scoreContentElement(nav));
    });

    it('penalizes footer content', () => {
        expect(scoreContentElement(contentElement({ context: { path: ['footer'] } }))).toBeLessThan(
            scoreContentElement(contentElement()),
        );
    });

    it('scores medium text above very short text', () => {
        const mediumText = 'A useful paragraph with enough words to represent meaningful page content.'.repeat(2);

        expect(scoreContentElement(contentElement({ text: mediumText }))).toBeGreaterThan(
            scoreContentElement(contentElement()),
        );
    });
});
