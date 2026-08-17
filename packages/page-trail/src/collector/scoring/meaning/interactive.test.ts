import { describe, expect, it } from 'vitest';

import type { InteractiveMeaningScoringData } from './interactive';
import { scoreInteractiveMeaning } from './interactive';

const baseScoringData: InteractiveMeaningScoringData = {
    role: 'button',
    type: 'button',
    labels: [],
    text: 'Save',
    state: {},
    bbox: { top: 0, left: 0, width: 100, height: 40, right: 100, bottom: 40 },
};

describe('scoreInteractiveMeaning', () => {
    it('returns raw score, normalized score, and selected features', () => {
        expect(scoreInteractiveMeaning(baseScoringData)).toEqual({
            score: 9,
            value: 20 / 22,
            features: ['TYPE_ACTION_INC_3', 'ROLE_CRITICAL_INC_3', 'NAME_TEXT_ONLY_INC_2', 'USABILITY_USABLE_INC_1'],
        });
    });

    it('scores explicitly labeled elements above text-only elements', () => {
        expect(
            scoreInteractiveMeaning({
                ...baseScoringData,
                labels: [{ source: 'aria-label', value: 'Submit form' }],
                text: undefined,
            }).value,
        ).toBeGreaterThan(scoreInteractiveMeaning(baseScoringData).value);
    });

    it('penalizes unnamed interactive elements', () => {
        expect(scoreInteractiveMeaning({ ...baseScoringData, text: undefined }).features).toContain(
            'NAME_MISSING_DEC_3',
        );
    });

    it('scores critical controls above plain links', () => {
        expect(scoreInteractiveMeaning({ ...baseScoringData, role: 'button', type: 'button' }).value).toBeGreaterThan(
            scoreInteractiveMeaning({ ...baseScoringData, role: 'link', type: 'link' }).value,
        );
    });

    it('scores text inputs and searchboxes as critical standalone targets', () => {
        expect(
            scoreInteractiveMeaning({
                ...baseScoringData,
                role: 'searchbox',
                type: 'input',
                labels: [{ source: 'placeholder', value: 'Search docs' }],
                text: undefined,
            }).features,
        ).toEqual(['TYPE_INPUT_INC_3', 'ROLE_CRITICAL_INC_3', 'NAME_STRONG_INC_3', 'USABILITY_USABLE_INC_1']);
    });

    it('scores selection controls as user-flow targets', () => {
        expect(
            scoreInteractiveMeaning({
                ...baseScoringData,
                role: 'combobox',
                type: 'select',
            }).features,
        ).toEqual(['TYPE_SELECTION_INC_2', 'ROLE_USER_FLOW_INC_2', 'NAME_TEXT_ONLY_INC_2', 'USABILITY_USABLE_INC_1']);
    });

    it('scores state controls as explicit state-change targets', () => {
        expect(
            scoreInteractiveMeaning({
                ...baseScoringData,
                role: 'switch',
                type: 'select',
            }).features,
        ).toEqual([
            'TYPE_SELECTION_INC_2',
            'ROLE_STATE_CONTROL_INC_2',
            'NAME_TEXT_ONLY_INC_2',
            'USABILITY_USABLE_INC_1',
        ]);
    });

    it('penalizes disabled, hidden, and readonly elements', () => {
        expect(scoreInteractiveMeaning({ ...baseScoringData, state: { disabled: true } }).value).toBeLessThan(
            scoreInteractiveMeaning(baseScoringData).value,
        );
        expect(scoreInteractiveMeaning({ ...baseScoringData, state: { hidden: true } }).value).toBeLessThan(
            scoreInteractiveMeaning(baseScoringData).value,
        );
        expect(scoreInteractiveMeaning({ ...baseScoringData, state: { readonly: true } }).value).toBeLessThan(
            scoreInteractiveMeaning(baseScoringData).value,
        );
    });

    it('adds a required-control feature', () => {
        expect(scoreInteractiveMeaning({ ...baseScoringData, state: { required: true } }).features).toContain(
            'REQUIRED_INC_1',
        );
    });

    it('penalizes very small targets', () => {
        expect(
            scoreInteractiveMeaning({
                ...baseScoringData,
                bbox: { top: 0, left: 0, width: 10, height: 10, right: 10, bottom: 10 },
            }).features,
        ).toContain('SIZE_TOO_SMALL_DEC_2');
    });

    it('does not use container context for meaning scoring', () => {
        const score = scoreInteractiveMeaning({
            ...baseScoringData,
            role: 'link',
            type: 'link',
            labels: [],
            text: 'Docs',
            state: {},
        });

        expect(score).toEqual({
            score: 5,
            value: 16 / 22,
            features: [
                'TYPE_NAVIGATION_INC_1',
                'ROLE_NAVIGATION_INC_1',
                'NAME_TEXT_ONLY_INC_2',
                'USABILITY_USABLE_INC_1',
            ],
        });
    });
});
