import { describe, expect, it } from 'vitest';

import { isSensitiveElement } from './sensitive';

describe('isSensitiveElement', () => {
    it('marks sensitive input types', () => {
        expect(isSensitiveElement(input('<input type="password" />'))).toBeTruthy();
        expect(isSensitiveElement(input('<input type="hidden" />'))).toBeTruthy();
        expect(isSensitiveElement(input('<input type="file" />'))).toBeTruthy();
    });

    it('marks input-like elements with sensitive attributes', () => {
        expect(isSensitiveElement(input('<input name="credit-card" />'))).toBeTruthy();
        expect(isSensitiveElement(input('<textarea placeholder="OTP code"></textarea>'))).toBeTruthy();
        expect(isSensitiveElement(input('<div role="textbox" aria-label="API key"></div>'))).toBeTruthy();
    });

    it('does not mark regular or non-input-like elements', () => {
        expect(isSensitiveElement(input('<input name="email" />'))).toBeFalsy();
        expect(isSensitiveElement(input('<button aria-label="password"></button>'))).toBeFalsy();
    });
});

function input(html: string) {
    document.body.innerHTML = html;

    return document.body.firstElementChild!;
}
