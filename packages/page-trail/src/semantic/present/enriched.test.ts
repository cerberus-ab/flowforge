import { describe, expect, it } from 'vitest';

import type { ContainerPathNode, ContainerRootNode } from '../../types';
import { containerElement, contentElement, interactiveElement } from '../../../test/fixtures';
import { presentEnrichedContent, presentEnrichedInteractive, presentEnrichedStructure } from './enriched';

function pathNode(container: ContainerPathNode['container'], distance = 0): ContainerPathNode {
    return {
        container,
        distance,
        relevanceScore: { value: 0.5 },
    };
}

describe('enriched semantic presentation', () => {
    it('adds semantic text to every container tree node', () => {
        // Given
        const structure: ContainerRootNode = {
            targets: [],
            nodes: [
                {
                    container: containerElement({
                        locator: { dataId: 'main', cssSelector: undefined },
                        role: 'main content',
                        type: 'landmark',
                    }),
                    targets: [],
                    nodes: [
                        {
                            container: containerElement({
                                locator: { dataId: 'checkout', cssSelector: undefined },
                                role: 'form',
                                type: 'form',
                                labels: [{ source: 'legend', value: 'Checkout' }],
                            }),
                            targets: [],
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
        const content = contentElement({
            context: {
                path: [
                    pathNode(
                        containerElement({
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
        const interactive = interactiveElement({
            context: {
                path: [
                    pathNode(
                        containerElement({
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
