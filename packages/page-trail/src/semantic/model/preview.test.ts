import { describe, expect, it } from 'vitest';

import type { ContainerPathNode, ContainerTreeNode } from '../../types';
import { containerElement, contentElement, interactiveElement } from '../../../test/fixtures';
import { semModelPreviewContent, semModelPreviewInteractive, semModelPreviewStructure } from './preview';

function pathNode(element: ContainerPathNode['element'], distance = 0): ContainerPathNode {
    return {
        element,
        distance,
        relevanceScore: { value: 0.5 },
    };
}

describe('semantic model preview', () => {
    it('creates a compact preview of the container tree', () => {
        // Given
        const structure: ContainerTreeNode[] = [
            {
                element: containerElement({
                    kind: 'container',
                    type: 'navigation',
                    tag: 'nav',
                    dataId: 'primary-nav',
                    cssSelector: '#primary-nav',
                    role: 'navigation',
                    labels: [{ source: 'aria-label', value: 'Primary' }],
                    meaningScore: { value: 0.8 },
                }),
                nodes: [
                    {
                        element: containerElement({
                            tag: 'form',
                            role: 'form',
                            labels: [{ source: 'legend', value: 'Search' }],
                            meaningScore: { value: 0.7 },
                        }),
                        nodes: [],
                    },
                ],
            },
        ];

        // When
        const preview = semModelPreviewStructure(structure);

        // Then
        expect(preview).toEqual([
            {
                tag: 'nav',
                role: 'navigation',
                labels: ['Primary'],
                semanticText: 'Navigation. Name: Primary',
                score: 0.8,
                nodes: [
                    {
                        tag: 'form',
                        role: 'form',
                        labels: ['Search'],
                        semanticText: 'Form. Name: Search',
                        score: 0.7,
                        nodes: [],
                    },
                ],
            },
        ]);
    });

    it('creates a compact preview of content elements with breadcrumb context', () => {
        // Given
        const content = contentElement({
            kind: 'content',
            type: 'heading',
            tag: 'h1',
            dataId: 'pricing-title',
            cssSelector: '#pricing-title',
            text: 'Pricing',
            importanceScore: { value: 0.9 },
            context: {
                path: [
                    pathNode(containerElement({ role: 'main content' })),
                    pathNode(
                        containerElement({
                            role: 'section',
                            labels: [{ source: 'heading', value: 'Plans' }],
                        }),
                    ),
                ],
                breadcrumbs: [0, 1],
                contextScore: { value: 0.5 },
            },
        });

        // When
        const preview = semModelPreviewContent([content]);

        // Then
        expect(preview).toEqual([
            {
                tag: 'h1',
                text: 'Pricing',
                semanticText: 'Heading h1: Pricing. Context: main content > section Plans',
                score: 0.9,
                context: ['Main content', 'Section. Name: Plans'],
            },
        ]);
    });

    it('creates a compact preview of interactive elements with semantic text and link type', () => {
        // Given
        const interactive = interactiveElement({
            tag: 'a',
            type: 'link',
            role: 'link',
            dataId: 'docs-link',
            cssSelector: '#docs-link',
            text: 'Docs',
            labels: [{ source: 'aria-label', value: 'Documentation' }],
            link: { type: 'external', href: 'https://example.com/docs' },
            inViewport: true,
            aboveTheFold: true,
            importanceScore: { value: 0.85 },
            context: {
                path: [
                    pathNode(
                        containerElement({
                            role: 'navigation',
                            labels: [{ source: 'aria-label', value: 'Primary' }],
                        }),
                    ),
                ],
                breadcrumbs: [0],
                contextScore: { value: 0.5 },
            },
        });

        // When
        const preview = semModelPreviewInteractive([interactive]);

        // Then
        expect(preview).toEqual([
            {
                tag: 'a',
                role: 'link',
                labels: ['Documentation'],
                text: 'Docs',
                semanticText:
                    'External link. Name: Documentation. Also labeled: Docs. Action: click action. State: visible on initial screen. Context: navigation Primary',
                score: 0.85,
                context: ['Navigation. Name: Primary'],
                link: 'external',
            },
        ]);
    });
});
