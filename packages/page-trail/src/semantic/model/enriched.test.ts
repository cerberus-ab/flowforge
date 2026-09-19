import { describe, expect, it } from 'vitest';

import type { ContainerPathNode, ContainerTreeNode } from '../../types';
import { containerElement, contentElement, interactiveElement } from '../../../test/fixtures';
import { semModelEnrichedContent, semModelEnrichedInteractive, semModelEnrichedStructure } from './enriched';

function pathNode(element: ContainerPathNode['element'], distance = 0): ContainerPathNode {
    return {
        element,
        distance,
        relevanceScore: { value: 0.5 },
    };
}

describe('semantic model enriched', () => {
    it('adds semantic text to every container tree node', () => {
        // Given
        const container: ContainerTreeNode[] = [
            {
                element: containerElement({
                    locator: { dataId: 'main', cssSelector: undefined },
                    role: 'main content',
                    type: 'landmark',
                }),
                nodes: [
                    {
                        element: containerElement({
                            locator: { dataId: 'checkout', cssSelector: undefined },
                            role: 'form',
                            type: 'form',
                            labels: [{ source: 'legend', value: 'Checkout' }],
                        }),
                        nodes: [],
                    },
                ],
            },
        ];

        // When
        const enriched = semModelEnrichedStructure(container);

        // Then
        expect(enriched).toMatchObject([
            {
                element: { locator: { dataId: 'main' }, semanticText: 'Main content' },
                nodes: [
                    {
                        element: { locator: { dataId: 'checkout' }, semanticText: 'Form. Name: Checkout' },
                    },
                ],
            },
        ]);
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
        const [enriched] = semModelEnrichedContent([content]);

        // Then
        expect(enriched!.context.path[0]!.element).toMatchObject({
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
        const [enriched] = semModelEnrichedInteractive([interactive]);

        // Then
        expect(enriched!.context.path[0]!.element).toMatchObject({
            locator: { dataId: 'primary-nav', cssSelector: undefined },
            semanticText: 'Navigation. Name: Primary',
        });
    });
});
