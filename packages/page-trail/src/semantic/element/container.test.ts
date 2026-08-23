import { describe, expect, it } from 'vitest';

import { containerElement } from '../../../test/fixtures';
import { semContainerElement } from './container';

describe('semContainerElement', () => {
    it('formats container role and labels without element context', () => {
        expect(
            semContainerElement(
                containerElement({
                    role: 'navigation',
                    type: 'navigation',
                    labels: [
                        { source: 'aria-label', value: 'Primary' },
                        { source: 'heading', value: 'Site links' },
                    ],
                }),
            ).text(),
        ).toBe('Navigation. Name: Primary. Also labeled: Site links');
    });

    it('omits name when no labels exist', () => {
        expect(semContainerElement(containerElement({ role: 'main content', type: 'landmark' })).text()).toBe(
            'Main content',
        );
    });

    it('deduplicates repeated label values', () => {
        expect(
            semContainerElement(
                containerElement({
                    labels: [
                        { source: 'aria-label', value: 'Checkout' },
                        { source: 'heading', value: 'Checkout' },
                    ],
                }),
            ).text(),
        ).toBe('Section. Name: Checkout');
    });
});
