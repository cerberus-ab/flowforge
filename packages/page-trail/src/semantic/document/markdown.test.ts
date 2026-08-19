import { describe, expect, it } from 'vitest';

import type { PageTrail } from '../../types';
import { contentElement, interactiveElement } from '../../../test/fixtures';
import { semMarkdown } from './markdown';

describe('semMarkdown', () => {
    it('generates a semantic markdown view for page basics, samples, content, and interactions', () => {
        const pageTrail = pageTrailFixture({
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

- Title: FlowForge Sandbox
- URL: https://example.com/sandbox
- Description: Extension sandbox for FlowForge.
- Language: en
- Viewport: 1280x720, scroll 0/1440

## Sample headings

Heading h1: Explore Embed

## Sample interactions

Button. Name: Start. Action: click action. State: visible on initial screen | Internal link. Name: Docs. Action: click action. State: currently visible

## Content

- Heading h1: Explore Embed
- Text: Click Start to launch the extension.

## Interactive

- Button. Name: Start. Action: click action. State: visible on initial screen
- Internal link. Name: Docs. Action: click action. State: currently visible`);
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

- Title: FlowForge Sandbox
- URL: https://example.com/sandbox
- Description: _None_
- Language: en
- Viewport: 1280x720, scroll 0/1440

## Sample headings

_None_

## Sample interactions

_None_

## Content

_None_

## Interactive

_None_`);
    });
});

function pageTrailFixture(overrides: Partial<PageTrail> = {}): PageTrail {
    return {
        basics: {
            url: 'https://example.com/sandbox',
            title: 'FlowForge Sandbox',
            description: 'Extension sandbox for FlowForge.',
            language: 'en',
            viewport: {
                width: 1280,
                height: 720,
                scrollY: 0,
                scrollHeight: 1440,
            },
        },
        container: [],
        content: [],
        interactive: [],
        metadata: {
            containerElements: 0,
            containerMaxDepth: 0,
            contentElements: 0,
            contentElementsTotal: 0,
            contentElementsLimitReached: false,
            interactiveElements: 0,
            interactiveElementsTotal: 0,
            interactiveElementsLimitReached: false,
            collectedAt: 0,
            performance: {
                basicsMs: 0,
                containerMs: 0,
                contentMs: 0,
                interactiveMs: 0,
                totalMs: 0,
            },
        },
        ...overrides,
    };
}
