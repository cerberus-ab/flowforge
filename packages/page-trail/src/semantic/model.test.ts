import { describe, expect, it } from 'vitest';

import type { ContainerPathNode, ContainerTreeNode } from '../types';
import { containerElement, contentElement, interactiveElement } from '../../test/fixtures';
import { semModelContainer, semModelContent, semModelInteractive } from './model';

function pathNode(element: ContainerPathNode['element'], distance = 0): ContainerPathNode {
    return {
        element,
        distance,
        relevanceScore: { value: 0.5 },
    };
}

describe('semantic model', () => {
    it('adds semantic text to every container tree node', () => {
        const container: ContainerTreeNode[] = [
            {
                element: containerElement({
                    dataId: 'main',
                    role: 'main content',
                    type: 'landmark',
                }),
                nodes: [
                    {
                        element: containerElement({
                            dataId: 'checkout',
                            role: 'form',
                            type: 'form',
                            labels: [{ source: 'legend', value: 'Checkout' }],
                        }),
                        nodes: [],
                    },
                ],
            },
        ];

        expect(semModelContainer(container)).toMatchObject([
            {
                element: { dataId: 'main', semanticText: 'Main content' },
                nodes: [
                    {
                        element: { dataId: 'checkout', semanticText: 'Form. Name: Checkout' },
                    },
                ],
            },
        ]);
    });

    it('adds semantic text to container elements in content context paths', () => {
        const content = contentElement({
            context: {
                path: [
                    pathNode(
                        containerElement({
                            dataId: 'article',
                            role: 'article',
                            labels: [{ source: 'heading', value: 'Release notes' }],
                        }),
                    ),
                ],
                breadcrumbs: [0],
                contextScore: { value: 0.5 },
            },
        });

        expect(semModelContent([content])[0]!.context.path[0]!.element).toMatchObject({
            dataId: 'article',
            semanticText: 'Article. Name: Release notes',
        });
    });

    it('adds semantic text to container elements in interactive context paths', () => {
        const interactive = interactiveElement({
            context: {
                path: [
                    pathNode(
                        containerElement({
                            dataId: 'primary-nav',
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

        expect(semModelInteractive([interactive])[0]!.context.path[0]!.element).toMatchObject({
            dataId: 'primary-nav',
            semanticText: 'Navigation. Name: Primary',
        });
    });
});
