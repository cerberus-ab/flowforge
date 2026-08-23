import { describe, expect, it } from 'vitest';

import type { ContentMeaningScoringData } from './content';
import { scoreContentMeaning } from './content';

const baseScoringData: ContentMeaningScoringData = {
    type: 'text',
    text: 'A useful paragraph with enough words to carry standalone meaning for ranking.',
};

describe('scoreContentMeaning', () => {
    it('returns raw score, normalized score, and selected features', () => {
        expect(scoreContentMeaning(baseScoringData)).toEqual({
            score: 3,
            value: 0.7,
            features: ['TYPE_TEXT_INC_1', 'TEXT_LENGTH_MEANINGFUL_INC_2'],
        });
    });

    it('scores headings above regular text with the same length', () => {
        expect(scoreContentMeaning({ ...baseScoringData, type: 'heading' }).value).toBeGreaterThan(
            scoreContentMeaning(baseScoringData).value,
        );
    });

    it('scores optimal paragraph text above short text', () => {
        const shortText = 'Short content';
        const optimalText = 'A focused paragraph with enough detail to describe a concrete part of the page clearly.';

        expect(scoreContentMeaning({ ...baseScoringData, text: optimalText }).value).toBeGreaterThan(
            scoreContentMeaning({ ...baseScoringData, text: shortText }).value,
        );
    });

    it('penalizes empty normalized text', () => {
        expect(scoreContentMeaning({ ...baseScoringData, text: '' })).toEqual({
            score: -3,
            value: 0.1,
            features: ['TYPE_TEXT_INC_1', 'TEXT_LENGTH_EMPTY_DEC_4'],
        });
    });

    it('penalizes very short snippets', () => {
        expect(scoreContentMeaning({ ...baseScoringData, text: 'Tiny' }).features).toEqual([
            'TYPE_TEXT_INC_1',
            'TEXT_LENGTH_TOO_SHORT_DEC_2',
        ]);
    });

    it('scores very long text below optimal paragraph text', () => {
        const optimalText = 'A focused paragraph with enough detail to describe a concrete part of the page clearly.';
        const tooLongText = 'Long paragraph content. '.repeat(40);

        expect(scoreContentMeaning({ ...baseScoringData, text: tooLongText }).value).toBeLessThan(
            scoreContentMeaning({ ...baseScoringData, text: optimalText }).value,
        );
    });

    it('returns feature diagnostics in weight declaration order', () => {
        expect(
            scoreContentMeaning({
                type: 'heading',
                text: 'Pricing',
            }).features,
        ).toEqual(['TYPE_HEADING_INC_3', 'TEXT_LENGTH_TOO_SHORT_DEC_2']);
    });
});
