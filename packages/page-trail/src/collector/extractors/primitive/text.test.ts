import { describe, expect, it } from 'vitest';

import { getElementText } from './text';

describe('getElementText', () => {
    it('returns normalized text content', () => {
        const el = document.createElement('div');
        el.textContent = ' Hello   world ! ';

        expect(getElementText(el)).toBe('Hello world!');
    });

    it('returns an empty string for empty text', () => {
        expect(getElementText(document.createElement('div'))).toBe('');
    });

    it('limits normalized text content when maxLength is provided', () => {
        const el = document.createElement('div');
        el.textContent = ' Open   the account settings panel ';

        expect(getElementText(el, { maxLength: 18 })).toBe('Open the account');
    });
});
