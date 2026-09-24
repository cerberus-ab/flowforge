import { describe, expect, it } from 'vitest';

import type { ContainerElement, ContainerTreeNode } from '../../types';
import {
    createContainerElementFixture,
    createContentElementFixture,
    createInteractiveElementFixture,
} from '../../../test/fixtures';
import { createPageTrailFixture } from '../../testing';
import { semMarkdown } from './markdown';

describe('semMarkdown', () => {
    it('generates Markdown page context with basics, structure, content, and interactions', () => {
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
        const markdown = semMarkdown(pageTrail);

        // Then
        expect(markdown).toBe(`# Page context

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

    it('uses empty markers for missing optional sections', () => {
        // Given
        const pageTrail = createPageTrailFixture({
            basics: {
                ...createPageTrailFixture().basics,
                description: '',
            },
            elements: [],
        });

        // When
        const markdown = semMarkdown(pageTrail);

        // Then
        expect(markdown).toBe(`# Page context

A semantic overview of page basics, structure, key interactions, and meaningful content.

## Basics

Basic information about the current page.

- Title: FlowForge Sandbox
- URL: https://example.com/sandbox
- Description: none
- Language: en
- Viewport: 1280x720, scroll 0/1440

## Structure

An outline of the detected page structure.

- Root

## Interactive

Key interactions sampled from the page.

none

## Content

Meaningful content blocks sampled from the page.

none
`);
    });

    it('summarizes and renders only selected blocks', () => {
        // Given
        const pageTrail = createPageTrailFixture();

        // When
        const markdown = semMarkdown(pageTrail, { blocks: ['structure', 'interactive'] });

        // Then
        expect(markdown).toContain('A semantic overview of structure and key interactions.');
        expect(markdown).toContain('## Structure');
        expect(markdown).toContain('## Interactive');
        expect(markdown).not.toContain('## Basics');
        expect(markdown).not.toContain('## Content');
    });

    it('handles an empty block selection', () => {
        expect(semMarkdown(createPageTrailFixture(), { blocks: [] })).toBe(`# Page context

No semantic sections selected.
`);
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
