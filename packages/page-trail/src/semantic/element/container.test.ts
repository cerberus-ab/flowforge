import { describe, expect, it } from 'vitest';

import {
    createContainerElementFixture,
    createContentElementFixture,
    createInteractiveElementFixture,
} from '../../../test/fixtures';
import { semContainerElement, semContainerRootNode, semContainerTreeNode } from './container';

describe('semContainerElement', () => {
    it('formats container role and labels without element context', () => {
        expect(
            semContainerElement(
                createContainerElementFixture({
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
        expect(
            semContainerElement(createContainerElementFixture({ role: 'main content', type: 'landmark' })).text(),
        ).toBe('Main content');
    });

    it('deduplicates repeated label values', () => {
        expect(
            semContainerElement(
                createContainerElementFixture({
                    labels: [
                        { source: 'aria-label', value: 'Checkout' },
                        { source: 'heading', value: 'Checkout' },
                    ],
                }),
            ).text(),
        ).toBe('Section. Name: Checkout');
    });
});

describe('semContainerTreeNode', () => {
    it('formats the container and direct element counts', () => {
        const node = {
            container: createContainerElementFixture({
                role: 'main content',
                labels: [{ source: 'aria-label' as const, value: 'Products' }],
            }),
            content: [createContentElementFixture(), createContentElementFixture()],
            interactive: [createInteractiveElementFixture()],
            nodes: [],
        };

        expect(semContainerTreeNode(node).text()).toBe(
            'Main content. Name: Products. Contains: 2 content(s), 1 interaction(s)',
        );
    });
});

describe('semContainerRootNode', () => {
    it('formats the root and omits empty element counts', () => {
        expect(semContainerRootNode({ content: [], interactive: [], nodes: [] }).text()).toBe('Root');
    });
});
