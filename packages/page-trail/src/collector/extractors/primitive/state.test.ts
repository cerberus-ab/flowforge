import { describe, expect, it } from 'vitest';

import { getInteractiveElementState } from './state';

describe('getInteractiveElementState', () => {
    it('extracts native form states', () => {
        // Given
        document.body.innerHTML = `<input type="checkbox" disabled readonly required checked />`;

        // When
        const state = getInteractiveElementState(document.querySelector('input')!);

        // Then
        expect(state).toEqual({
            disabled: true,
            readonly: true,
            required: true,
            checked: true,
        });
    });

    it('lets aria states override native states', () => {
        // Given
        document.body.innerHTML = `<button disabled aria-disabled="false" aria-pressed="true"></button>`;

        // When
        const state = getInteractiveElementState(document.querySelector('button')!);

        // Then
        expect(state).toEqual({
            disabled: false,
            pressed: true,
        });
    });

    it('extracts selected option state', () => {
        // Given
        document.body.innerHTML = `<select><option selected>One</option></select>`;

        // When
        const state = getInteractiveElementState(document.querySelector('option')!);

        // Then
        expect(state).toEqual({
            disabled: false,
            selected: true,
        });
    });
});
