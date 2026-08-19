import { describe, expect, it } from 'vitest';

import { interactiveElement } from '../../../test/fixtures';
import { semInteractiveElement } from './interactive';

describe('semInteractiveElement', () => {
    it('formats button name, state, and visibility without element context', () => {
        expect(
            semInteractiveElement(
                interactiveElement({
                    labels: [{ source: 'aria-label', value: 'Save changes' }],
                    state: { disabled: true, required: true },
                    aboveTheFold: true,
                }),
            ).text(),
        ).toBe(
            'Button. Name: Save changes. Also labeled: Save. Action: click action. State: disabled, required, visible on initial screen',
        );
    });

    it('formats links by link type', () => {
        expect(
            semInteractiveElement(
                interactiveElement({
                    type: 'link',
                    role: 'link',
                    text: 'Docs',
                    link: { type: 'external', href: 'https://example.com/docs' },
                }),
            ).text(),
        ).toBe('External link. Name: Docs. Action: click action');
    });

    it('omits name when no label or text exists', () => {
        expect(semInteractiveElement(interactiveElement({ text: undefined, labels: [] })).text()).toBe(
            'Button. Action: click action',
        );
    });
});
