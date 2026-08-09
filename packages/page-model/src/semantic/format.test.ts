import { describe, expect, it } from 'vitest';

import { contentElement, interactiveElement } from '../test/fixtures';
import {
    formantElementContextPath,
    formatConcatElements,
    formatContentElement,
    formatContentElementShort,
    formatInteractiveElement,
    formatInteractiveElementShort,
} from './format';

describe('formatContentElementShort', () => {
    it('formats tag and text', () => {
        expect(formatContentElementShort(contentElement())).toBe('p. Welcome');
    });

    it('uses text override', () => {
        expect(formatContentElementShort(contentElement(), 'Hello')).toBe('p. Hello');
    });
});

describe('formatInteractiveElementShort', () => {
    it('uses the first label as anchor', () => {
        expect(
            formatInteractiveElementShort(
                interactiveElement({
                    labels: [{ source: 'aria-label', value: 'Submit form' }],
                }),
            ),
        ).toBe('button. Submit form');
    });

    it('falls back to text', () => {
        expect(formatInteractiveElementShort(interactiveElement())).toBe('button. Save');
    });
});

describe('formatConcatElements', () => {
    it('joins formatted elements', () => {
        expect(formatConcatElements(['one', 'two', 'three'])).toBe('one | two | three');
    });
});

describe('formantElementContextPath', () => {
    it('joins context path roles', () => {
        expect(formantElementContextPath(['main content', 'form'])).toBe('main content > form');
    });
});

describe('formatContentElement', () => {
    it('formats content with context', () => {
        expect(
            formatContentElement(
                contentElement({
                    type: 'heading',
                    text: 'Pricing',
                    context: { sectionName: 'Plans', path: ['main content'] },
                }),
            ),
        ).toBe('heading. Pricing. in section "Plans". inside "main content"');
    });
});

describe('formatInteractiveElement', () => {
    it('formats button name, state, visibility, and context', () => {
        expect(
            formatInteractiveElement(
                interactiveElement({
                    labels: [{ source: 'aria-label', value: 'Save changes' }],
                    state: { disabled: true, required: true },
                    aboveTheFold: true,
                    context: { path: ['form'], sectionName: 'Profile' },
                }),
            ),
        ).toBe(
            'button. click action. name "Save changes; Save". disabled. required. visible on initial screen. in section "Profile". inside "form"',
        );
    });

    it('formats links by link type', () => {
        expect(
            formatInteractiveElement(
                interactiveElement({
                    type: 'link',
                    role: 'link',
                    text: 'Docs',
                    link: { type: 'external', href: 'https://example.com/docs' },
                }),
            ),
        ).toBe('external link. click action. name "Docs"');
    });
});
