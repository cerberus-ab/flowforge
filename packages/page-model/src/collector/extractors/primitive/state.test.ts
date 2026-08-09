import { describe, expect, it } from 'vitest';

import { getInteractiveElementState } from './state';

describe('getInteractiveElementState', () => {
    it('extracts native form states', () => {
        document.body.innerHTML = `<input type="checkbox" disabled readonly required checked />`;

        expect(getInteractiveElementState(document.querySelector('input')!)).toEqual({
            disabled: true,
            readonly: true,
            required: true,
            checked: true,
        });
    });

    it('lets aria states override native states', () => {
        document.body.innerHTML = `<button disabled aria-disabled="false" aria-pressed="true"></button>`;

        expect(getInteractiveElementState(document.querySelector('button')!)).toEqual({
            disabled: false,
            pressed: true,
        });
    });

    it('extracts selected option state', () => {
        document.body.innerHTML = `<select><option selected>One</option></select>`;

        expect(getInteractiveElementState(document.querySelector('option')!)).toEqual({
            disabled: false,
            selected: true,
        });
    });
});
