import { describe, expect, it } from 'vitest';

import type { ContainerPathNode, ContainerRootNode } from '../../types';
import {
    createContainerElementFixture,
    createContentElementFixture,
    createInteractiveElementFixture,
} from '../../../test/fixtures';
import { presentPreviewContent, presentPreviewInteractive, presentPreviewStructure } from './preview';

function pathNode(container: ContainerPathNode['container'], distance = 0): ContainerPathNode {
    return {
        container,
        distance,
        relevanceScore: { value: 0.5 },
    };
}

describe('preview semantic presentation', () => {
    it('creates a compact preview of root content and interactive elements', () => {
        // Given
        const structure: ContainerRootNode = {
            content: [
                createContentElementFixture({
                    tag: 'p',
                    text: 'Welcome',
                    importanceScore: { value: 0.6 },
                }),
            ],
            interactive: [
                createInteractiveElementFixture({
                    text: 'Save changes',
                    importanceScore: { value: 0.7 },
                }),
            ],
            nodes: [],
        };

        // When
        const preview = presentPreviewStructure(structure);

        // Then
        expect(preview).toEqual({
            semanticText: 'root',
            nodes: [],
            content: [
                {
                    tag: 'p',
                    text: 'Welcome',
                    semanticText: 'Text: Welcome',
                    score: 0.6,
                    context: [],
                },
            ],
            interactive: [
                {
                    tag: 'button',
                    role: 'button',
                    labels: [],
                    text: 'Save changes',
                    semanticText: 'Button. Name: Save changes. Action: click action',
                    score: 0.7,
                    context: [],
                    link: undefined,
                },
            ],
        });
    });

    it('creates a compact preview of the container tree', () => {
        // Given
        const structure: ContainerRootNode = {
            content: [],
            interactive: [],
            nodes: [
                {
                    container: createContainerElementFixture({
                        kind: 'container',
                        type: 'navigation',
                        tag: 'nav',
                        locator: { dataId: 'primary-nav', cssSelector: '#primary-nav' },
                        role: 'navigation',
                        labels: [{ source: 'aria-label', value: 'Primary' }],
                        meaningScore: { value: 0.8 },
                    }),
                    content: [],
                    interactive: [],
                    nodes: [
                        {
                            container: createContainerElementFixture({
                                tag: 'form',
                                role: 'form',
                                labels: [{ source: 'legend', value: 'Search' }],
                                meaningScore: { value: 0.7 },
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
        const preview = presentPreviewStructure(structure);

        // Then
        expect(preview).toEqual({
            semanticText: 'root',
            content: [],
            interactive: [],
            nodes: [
                {
                    tag: 'nav',
                    role: 'navigation',
                    labels: ['Primary'],
                    semanticText: 'Navigation. Name: Primary',
                    score: 0.8,
                    content: [],
                    interactive: [],
                    nodes: [
                        {
                            tag: 'form',
                            role: 'form',
                            labels: ['Search'],
                            semanticText: 'Form. Name: Search',
                            score: 0.7,
                            content: [],
                            interactive: [],
                            nodes: [],
                        },
                    ],
                },
            ],
        });
    });

    it('creates a compact preview of content elements with breadcrumb context', () => {
        // Given
        const content = createContentElementFixture({
            kind: 'content',
            type: 'heading',
            tag: 'h1',
            locator: { dataId: 'pricing-title', cssSelector: '#pricing-title' },
            text: 'Pricing',
            importanceScore: { value: 0.9 },
            context: {
                path: [
                    pathNode(createContainerElementFixture({ role: 'main content' })),
                    pathNode(
                        createContainerElementFixture({
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
        const preview = presentPreviewContent([content]);

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
        const interactive = createInteractiveElementFixture({
            tag: 'a',
            type: 'link',
            role: 'link',
            locator: { dataId: 'docs-link', cssSelector: '#docs-link' },
            text: 'Docs',
            labels: [{ source: 'aria-label', value: 'Documentation' }],
            link: { type: 'external', href: 'https://example.com/docs' },
            inViewport: true,
            aboveTheFold: true,
            importanceScore: { value: 0.85 },
            context: {
                path: [
                    pathNode(
                        createContainerElementFixture({
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
        const preview = presentPreviewInteractive([interactive]);

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
