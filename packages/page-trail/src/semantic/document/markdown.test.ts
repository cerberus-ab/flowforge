import { describe, expect, it } from 'vitest';

import type { ContainerElement, ContainerTreeNode } from '../../types';
import { containerElement, contentElement, interactiveElement, pageTrailFixture } from '../../../test/fixtures';
import { semMarkdown } from './markdown';

describe('semMarkdown', () => {
    it('generates a semantic markdown view for page basics, samples, content, and interactions', () => {
        const pageTrail = pageTrailFixture({
            structure: [containerNode('Main', 'main content', [containerNode('Tabs', 'navigation')])],
            content: [
                contentElement({
                    type: 'heading',
                    tag: 'h1',
                    text: 'Explore Embed',
                    importanceScore: { value: 0.9 },
                }),
                contentElement({
                    type: 'text',
                    tag: 'p',
                    text: 'Click Start to launch the extension.',
                    importanceScore: { value: 0.4 },
                }),
            ],
            interactive: [
                interactiveElement({
                    text: 'Start',
                    importanceScore: { value: 0.8 },
                    aboveTheFold: true,
                }),
                interactiveElement({
                    type: 'link',
                    role: 'link',
                    text: 'Docs',
                    link: { type: 'internal', href: '/docs' },
                    importanceScore: { value: 0.7 },
                    inViewport: true,
                }),
            ],
        });

        expect(semMarkdown(pageTrail)).toBe(`# Semantic view

## Page

Basic information about the current page.

- Title: FlowForge Sandbox
- URL: https://example.com/sandbox
- Description: Extension sandbox for FlowForge.
- Language: en
- Viewport: 1280x720, scroll 0/1440

## Sample structure

An outline of the detected page structure.

- Main content. Name: Main
  - Navigation. Name: Tabs

## Sample headings

Up to 5 representative headings on the page.

1. Heading h1: Explore Embed

## Sample interactions

Up to 15 representative interactions on the page.

1. Button. Name: Start. Action: click action. State: visible on initial screen
2. Internal link. Name: Docs. Action: click action. State: currently visible

## Meaningful content

Some meaningful text blocks sampled from the page.

Text: Click Start to launch the extension.
`);
    });

    it('uses empty markers for missing optional sections', () => {
        const pageTrail = pageTrailFixture({
            basics: {
                ...pageTrailFixture().basics,
                description: '',
            },
            content: [],
            interactive: [],
        });

        expect(semMarkdown(pageTrail)).toBe(`# Semantic view

## Page

Basic information about the current page.

- Title: FlowForge Sandbox
- URL: https://example.com/sandbox
- Description: _None_
- Language: en
- Viewport: 1280x720, scroll 0/1440

## Sample structure

An outline of the detected page structure.

_None_

## Sample headings

Up to 5 representative headings on the page.

_None_

## Sample interactions

Up to 15 representative interactions on the page.

_None_

## Meaningful content

Some meaningful text blocks sampled from the page.

_None_
`);
    });
});

function containerNode(
    name: string,
    role: ContainerElement['role'] = 'section',
    nodes: ContainerTreeNode[] = [],
): ContainerTreeNode {
    return {
        element: containerElement({
            role,
            labels: [{ source: 'aria-label', value: name }],
        }),
        nodes,
    };
}
