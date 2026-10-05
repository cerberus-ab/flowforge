import { describe, expect, it } from 'vitest';

import type { ContainerPathNode, ContainerRootNode } from '../../types';
import {
    createContainerElementFixture,
    createContentElementFixture,
    createInteractiveElementFixture,
} from '../../../test/fixtures';
import { presentEnrichedContent, presentEnrichedInteractive, presentEnrichedStructure } from './enriched';

function pathNode(container: ContainerPathNode['container'], distance = 0): ContainerPathNode {
    return {
        container,
        distance,
        relevanceScore: { value: 0.5 },
    };
}

describe('enriched semantic presentation', () => {
    it('adds semantic text to root content and interactive elements', () => {
        // Given
        const content = createContentElementFixture({
            text: 'Welcome',
            context: {
                path: [pathNode(createContainerElementFixture({ role: 'main content' }))],
                breadcrumbs: [0],
                contextScore: { value: 0.5 },
            },
        });
        const interactive = createInteractiveElementFixture({
            text: 'Save changes',
        });
        const structure: ContainerRootNode = {
            content: [content],
            interactive: [interactive],
            nodes: [],
        };

        // When
        const enriched = presentEnrichedStructure(structure);

        // Then
        expect(enriched.content).toMatchObject([
            {
                text: 'Welcome',
                semanticText: 'Text: Welcome. Context: main content',
                context: {
                    path: [{ container: { semanticText: 'Main content' } }],
                },
            },
        ]);
        expect(enriched.interactive).toMatchObject([
            {
                text: 'Save changes',
                semanticText: 'Button. Name: Save changes. Action: click action',
            },
        ]);
    });

    it('adds semantic text to every container tree node', () => {
        // Given
        const structure: ContainerRootNode = {
            content: [],
            interactive: [],
            nodes: [
                {
                    container: createContainerElementFixture({
                        locator: { dataId: 'main', cssSelector: undefined },
                        role: 'main content',
                        type: 'landmark',
                    }),
                    content: [],
                    interactive: [],
                    nodes: [
                        {
                            container: createContainerElementFixture({
                                locator: { dataId: 'checkout', cssSelector: undefined },
                                role: 'form',
                                type: 'form',
                                labels: [{ source: 'legend', value: 'Checkout' }],
                            }),
                            content: [],
                            interactive: [],
                            nodes: [],
                        },
                    ],
                },
            ],
        };

        // When
        const enriched = presentEnrichedStructure(structure);

        // Then
        expect(enriched).toMatchObject({
            semanticText: 'root',
            nodes: [
                {
                    container: { locator: { dataId: 'main' }, semanticText: 'Main content' },
                    nodes: [
                        {
                            container: { locator: { dataId: 'checkout' }, semanticText: 'Form. Name: Checkout' },
                        },
                    ],
                },
            ],
        });
    });

    it('adds semantic text to container elements in content context paths', () => {
        // Given
        const content = createContentElementFixture({
            context: {
                path: [
                    pathNode(
                        createContainerElementFixture({
                            locator: { dataId: 'article', cssSelector: undefined },
                            role: 'article',
                            labels: [{ source: 'heading', value: 'Release notes' }],
                        }),
                    ),
                ],
                breadcrumbs: [0],
                contextScore: { value: 0.5 },
            },
        });

        // When
        const [enriched] = presentEnrichedContent([content]);

        // Then
        expect(enriched!.context.path[0]!.container).toMatchObject({
            locator: { dataId: 'article', cssSelector: undefined },
            semanticText: 'Article. Name: Release notes',
        });
    });

    it('adds semantic text to container elements in interactive context paths', () => {
        // Given
        const interactive = createInteractiveElementFixture({
            context: {
                path: [
                    pathNode(
                        createContainerElementFixture({
                            locator: { dataId: 'primary-nav', cssSelector: undefined },
                            role: 'navigation',
                            type: 'navigation',
                            labels: [{ source: 'aria-label', value: 'Primary' }],
                        }),
                    ),
                ],
                breadcrumbs: [0],
                contextScore: { value: 0.5 },
            },
        });

        // When
        const [enriched] = presentEnrichedInteractive([interactive]);

        // Then
        expect(enriched!.context.path[0]!.container).toMatchObject({
            locator: { dataId: 'primary-nav', cssSelector: undefined },
            semanticText: 'Navigation. Name: Primary',
        });
    });
});
