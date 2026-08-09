import { describe, expect, it } from 'vitest';

import { getElementAttrAriaLabelledBy, getElementLabels } from './label';

describe('getElementAttrAriaLabelledBy', () => {
    it('resolves referenced label text', () => {
        document.body.innerHTML = `
            <span id="first"> First </span>
            <span id="second"> second label </span>
            <button aria-labelledby="first second"></button>
        `;

        const button = document.querySelector('button')!;

        expect(getElementAttrAriaLabelledBy(button, document)).toBe('First second label');
    });

    it('returns undefined when the attribute is missing', () => {
        expect(getElementAttrAriaLabelledBy(document.createElement('button'), document)).toBeUndefined();
    });
});

describe('getElementLabels', () => {
    it('returns labels in priority order', () => {
        document.body.innerHTML = `
            <span id="label">Visible label</span>
            <label for="email">Email field</label>
            <input
                id="email"
                aria-labelledby="label"
                aria-label="Email"
                placeholder="name@example.com"
                title="Work email"
                name="email"
            />
        `;

        const input = document.querySelector('input')!;

        expect(getElementLabels(input, document)).toEqual([
            { value: 'Visible label', source: 'aria-labelledby' },
            { value: 'Email', source: 'aria-label' },
            { value: 'Email field', source: 'label-for' },
            { value: 'name@example.com', source: 'placeholder' },
            { value: 'Work email', source: 'title' },
        ]);
    });

    it('extracts wrapper labels and deduplicates values case-insensitively', () => {
        document.body.innerHTML = `
            <label>
                Save
                <button aria-label="save" value="Save"></button>
            </label>
        `;

        const button = document.querySelector('button')!;

        expect(getElementLabels(button, document)).toEqual([{ value: 'save', source: 'aria-label' }]);
    });

    it('returns an empty array when no labels are found', () => {
        expect(getElementLabels(document.createElement('div'), document)).toEqual([]);
    });
});
