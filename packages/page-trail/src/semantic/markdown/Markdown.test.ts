import { describe, expect, it } from 'vitest';

import type { ContainerElement, ContainerTreeNode } from '../../types';
import {
    createContainerElementFixture,
    createContentElementFixture,
    createInteractiveElementFixture,
} from '../../../test/fixtures.ts';
import { createPageTrailFixture } from '../../testing';
import { Markdown } from './Markdown.ts';

describe('Markdown', () => {
    it('renders the selected PageTrail context as Markdown', () => {
        // Given
        const pageTrail = createPageTrailFixture({
            structure: {
                content: [],
                interactive: [],
                nodes: [containerNode('Main', 'main content', [containerNode('Tabs', 'navigation')])],
            },
            elements: [
                createContentElementFixture({
                    type: 'heading',
                    tag: 'h1',
                    text: 'Explore Embed',
                    importanceScore: { value: 0.9 },
                }),
                createContentElementFixture({
                    type: 'text',
                    tag: 'p',
                    text: 'Click Start to launch the extension.',
                    importanceScore: { value: 0.4 },
                }),
                createInteractiveElementFixture({
                    text: 'Start',
                    importanceScore: { value: 0.8 },
                    aboveTheFold: true,
                }),
                createInteractiveElementFixture({
                    type: 'link',
                    role: 'link',
                    text: 'Docs',
                    link: { type: 'internal', href: '/docs' },
                    importanceScore: { value: 0.7 },
                    inViewport: true,
                }),
            ],
        });

        // When
        const markdown = Markdown.from(pageTrail);

        // Then
        expect(markdown.toString()).toBe(`# Page context

A semantic overview of page basics, structure, key interactions, and meaningful content.

## Basics

Basic information about the current page.

- Title: FlowForge Sandbox
- URL: https://example.com/sandbox
- Description: Extension sandbox for FlowForge.
- Language: en
- Viewport: 1280x720, scroll 0/1440

## Structure

An outline of the detected page structure.

- Root
  - Main content. Name: Main
    - Navigation. Name: Tabs

## Interactive

Key interactions sampled from the page.

1. Button. Name: Start. Action: click action. State: visible on initial screen
2. Internal link. Name: Docs. Action: click action. State: currently visible

## Content

Meaningful content blocks sampled from the page.

- Text: Click Start to launch the extension.
`);
    });

    it('renders only requested blocks', () => {
        // Given
        const pageTrail = createPageTrailFixture();

        // When
        const markdown = Markdown.from(pageTrail, { blocks: ['structure', 'interactive'] }).toString();

        // Then
        expect(markdown).toContain('A semantic overview of structure and key interactions.');
        expect(markdown).toContain('## Structure');
        expect(markdown).toContain('## Interactive');
        expect(markdown).not.toContain('## Basics');
        expect(markdown).not.toContain('## Content');
    });

    it('renders a summary when no blocks are selected', () => {
        // Given / When
        const markdown = Markdown.from(createPageTrailFixture(), { blocks: [] });

        // Then
        expect(markdown.toString()).toBe('# Page context\n\nNo semantic sections selected.\n');
    });

    it('reports the rendered Markdown length', () => {
        // Given
        const markdown = Markdown.from(createPageTrailFixture());

        // Then
        expect(markdown.length).toBe(markdown.toString().length);
    });

    it('estimates tokens from the rendered Markdown content', () => {
        // Given
        const markdown = Markdown.from(createPageTrailFixture());

        // Then
        expect(markdown.estimatedTokenCount()).toBe(
            Math.ceil(new TextEncoder().encode(markdown.toString()).length / 4),
        );
    });
});

function containerNode(
    name: string,
    role: ContainerElement['role'] = 'section',
    nodes: ContainerTreeNode[] = [],
): ContainerTreeNode {
    return {
        container: createContainerElementFixture({
            role,
            labels: [{ source: 'aria-label', value: name }],
        }),
        content: [],
        interactive: [],
        nodes,
    };
}
