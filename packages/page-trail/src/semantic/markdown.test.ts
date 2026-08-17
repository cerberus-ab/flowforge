import { describe, expect, it } from 'vitest';

import type { PageTrail } from '../types';
import { contentElement, interactiveElement } from '../../test/fixtures';
import { generateSemanticMarkdown } from './markdown';

describe('generateSemanticMarkdown', () => {
    it('generates a semantic markdown view for page basics, samples, content, and interactions', () => {
        const pageTrail = pageTrailFixture({
            content: [
                contentElement({
                    type: 'heading',
                    tag: 'h1',
                    text: 'Explore Embed',
                    importanceScore: 0.9,
                    contextDeprecated: { path: ['main content'] },
                }),
                contentElement({
                    type: 'text',
                    tag: 'p',
                    text: 'Click Start to launch the extension.',
                    importanceScore: 0.4,
                    contextDeprecated: { path: ['main content'], sectionName: 'Controls' },
                }),
            ],
            interactive: [
                interactiveElement({
                    text: 'Start',
                    importanceScore: 0.8,
                    aboveTheFold: true,
                    contextDeprecated: { path: ['toolbar'] },
                }),
                interactiveElement({
                    type: 'link',
                    role: 'link',
                    text: 'Docs',
                    link: { type: 'internal', href: '/docs' },
                    importanceScore: 0.7,
                    inViewport: true,
                    contextDeprecated: { path: ['navigation'] },
                }),
            ],
        });

        expect(generateSemanticMarkdown(pageTrail)).toBe(`# Semantic view

## Page

- Title: FlowForge Sandbox
- URL: https://example.com/sandbox
- Description: Extension sandbox for FlowForge.
- Language: en
- Viewport: 1280x720, scroll 0/1440

## Sample headings

h1. Explore Embed

## Sample interactions

button. Start | link. Docs

## Content

- heading. Explore Embed. inside "main content"
- text. Click Start to launch the extension.. in section "Controls". inside "main content"

## Interactive

- button. click action. name "Start". visible on initial screen. inside "toolbar"
- internal link. click action. name "Docs". currently visible. inside "navigation"`);
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

        expect(generateSemanticMarkdown(pageTrail)).toBe(`# Semantic view

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
        content: [],
        interactive: [],
        metadata: {
            contentElements: 0,
            contentElementsTotal: 0,
            contentElementsLimitReached: false,
            interactiveElements: 0,
            interactiveElementsTotal: 0,
            interactiveElementsLimitReached: false,
            collectedAt: 0,
            durationMs: 0,
        },
        ...overrides,
    };
}
