import { describe, expect, it } from 'vitest';

import { createContainerElementFixture, createContentElementFixture } from '../../../test/fixtures';
import { semContentElement } from './content';

describe('semContentElement', () => {
    it('formats heading kind with its heading tag', () => {
        expect(
            semContentElement(
                createContentElementFixture({
                    type: 'heading',
                    tag: 'h1',
                    text: 'Pricing',
                }),
            ).text(),
        ).toBe('Heading h1: Pricing');
    });

    it('uses text override', () => {
        expect(semContentElement(createContentElementFixture(), 'Hello').text()).toBe('Text: Hello');
    });

    it('formats element context with short breadcrumb labels', () => {
        expect(
            semContentElement(
                createContentElementFixture({
                    text: 'Confirm order',
                    context: {
                        path: [
                            {
                                container: createContainerElementFixture({ role: 'main content' }),
                                distance: 2,
                                relevanceScore: { value: 0.8 },
                            },
                            {
                                container: createContainerElementFixture({
                                    role: 'section',
                                    labels: [
                                        { source: 'heading', value: 'Checkout' },
                                        { source: 'aria-label', value: 'Order form' },
                                    ],
                                }),
                                distance: 1,
                                relevanceScore: { value: 0.9 },
                            },
                        ],
                        breadcrumbs: [0, 1],
                        contextScore: { value: 0.8 },
                    },
                }),
            ).text(),
        ).toBe('Text: Confirm order. Context: main content > section Checkout');
    });
});
