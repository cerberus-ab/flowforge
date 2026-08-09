import { describe, expect, it } from 'vitest';

import { getElementText } from './text';

describe('getElementText', () => {
    it('returns normalized text content', () => {
        const el = document.createElement('div');
        el.textContent = ' Hello   world ! ';

        expect(getElementText(el)).toBe('Hello world!');
    });

    it('returns undefined for empty text', () => {
        expect(getElementText(document.createElement('div'))).toBeUndefined();
    });
});
