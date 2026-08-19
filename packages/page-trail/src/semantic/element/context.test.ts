import { describe, expect, it } from 'vitest';

import type { ElementContext } from '../../types';
import { containerElement } from '../../../test/fixtures';
import { semElementContext } from './context';

describe('semElementContext', () => {
    it('returns undefined when no breadcrumbs are selected', () => {
        expect(semElementContext(contextFixture())).toBeUndefined();
    });

    it('formats selected breadcrumb containers in breadcrumb order', () => {
        expect(
            semElementContext(
                contextFixture({
                    path: [
                        {
                            element: containerElement({ role: 'main content' }),
                            distance: 2,
                            relevanceScore: { value: 0.8 },
                        },
                        {
                            element: containerElement({
                                role: 'section',
                                labels: [{ source: 'heading', value: 'Pricing' }],
                            }),
                            distance: 1,
                            relevanceScore: { value: 0.9 },
                        },
                        {
                            element: containerElement({
                                role: 'form',
                                labels: [{ source: 'legend', value: 'Checkout' }],
                            }),
                            distance: 0,
                            relevanceScore: { value: 1 },
                        },
                    ],
                    breadcrumbs: [0, 2],
                }),
            ),
        ).toBe('main content > form Checkout');
    });

    it('uses the first container label as context name', () => {
        expect(
            semElementContext(
                contextFixture({
                    path: [
                        {
                            element: containerElement({
                                role: 'navigation',
                                labels: [
                                    { source: 'aria-label', value: 'Primary' },
                                    { source: 'heading', value: 'Site links' },
                                ],
                            }),
                            distance: 0,
                            relevanceScore: { value: 1 },
                        },
                    ],
                    breadcrumbs: [0],
                }),
            ),
        ).toBe('navigation Primary');
    });

    it('skips breadcrumb indexes that do not exist in the path', () => {
        expect(
            semElementContext(
                contextFixture({
                    path: [
                        {
                            element: containerElement({ role: 'footer' }),
                            distance: 0,
                            relevanceScore: { value: 1 },
                        },
                    ],
                    breadcrumbs: [0, 1],
                }),
            ),
        ).toBe('footer');
    });
});

function contextFixture(overrides: Partial<ElementContext> = {}): ElementContext {
    return {
        path: [],
        breadcrumbs: [],
        contextScore: { value: 0 },
        ...overrides,
    };
}
