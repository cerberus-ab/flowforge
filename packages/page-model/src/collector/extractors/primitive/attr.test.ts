import { describe, expect, it } from 'vitest';

import { getElementBooleanAttribute } from './attr';

describe('getElementBooleanAttribute', () => {
    it('parses true and false values', () => {
        const el = document.createElement('div');

        el.setAttribute('aria-expanded', 'true');
        expect(getElementBooleanAttribute(el, 'aria-expanded')).toBeTruthy();

        el.setAttribute('aria-expanded', 'false');
        expect(getElementBooleanAttribute(el, 'aria-expanded')).toBeFalsy();
    });

    it('returns undefined for missing or invalid values', () => {
        const el = document.createElement('div');

        expect(getElementBooleanAttribute(el, 'aria-expanded')).toBeUndefined();

        el.setAttribute('aria-expanded', 'mixed');
        expect(getElementBooleanAttribute(el, 'aria-expanded')).toBeUndefined();
    });
});
