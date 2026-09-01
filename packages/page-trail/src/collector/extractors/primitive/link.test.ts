import { describe, expect, it } from 'vitest';

import { getElementLink } from './link';

describe('getElementLink', () => {
    it('classifies same-origin links as internal', () => {
        // Given
        document.body.innerHTML = `<a href="/settings">Settings</a>`;

        // When
        const link = getElementLink(document.querySelector('a')!);

        // Then
        expect(link).toEqual({
            type: 'internal',
            href: 'http://localhost:3000/settings',
        });
    });

    it('classifies external, anchor, mailto, and tel links', () => {
        expect(linkType('https://example.com')).toBe('external');
        expect(linkTypeFromAttribute('#pricing')).toBe('anchor');
        expect(linkType('mailto:hello@app.test')).toBe('mailto');
        expect(linkType('tel:+123456789')).toBe('tel');
    });

    it('returns undefined without href', () => {
        expect(getElementLink(document.createElement('button'))).toBeUndefined();
    });
});

function linkType(href: string) {
    const el = document.createElement('a');
    el.setAttribute('href', href);

    return getElementLink(el)?.type;
}

function linkTypeFromAttribute(href: string) {
    const el = document.createElement('div');
    el.setAttribute('href', href);

    return getElementLink(el)?.type;
}
