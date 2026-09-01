import { describe, expect, it } from 'vitest';

import type { ContainerElement, ContainerTreeNode } from '../../types';
import { containerElement, contentElement, interactiveElement } from '../../../test/fixtures';
import { semSampleStructure, semSampleHeadings, semSampleInteractions, semSampleTexts } from './basics';

describe('semSampleHeadings', () => {
    it('formats headings sorted by importance and limited by headingsLimit', () => {
        // Given
        const content = [
            contentElement({
                type: 'heading',
                tag: 'h2',
                text: 'Features',
                importanceScore: { value: 0.6 },
            }),
            contentElement({
                type: 'text',
                tag: 'p',
                text: 'Ignored body copy',
                importanceScore: { value: 1 },
            }),
            contentElement({
                type: 'heading',
                tag: 'h1',
                text: 'Welcome',
                importanceScore: { value: 0.9 },
            }),
            contentElement({
                type: 'heading',
                tag: 'h3',
                text: 'Details',
                importanceScore: { value: 0.4 },
            }),
        ];

        // When
        const headings = semSampleHeadings(content, 2);

        // Then
        expect(headings).toEqual(['Heading h1: Welcome', 'Heading h2: Features']);
    });

    it('returns an empty array when there are no headings', () => {
        expect(semSampleHeadings([contentElement({ type: 'text', tag: 'p', text: 'Body' })])).toEqual([]);
    });
});

describe('semSampleTexts', () => {
    it('formats text blocks sorted by importance and limited by limit', () => {
        // Given
        const content = [
            contentElement({
                type: 'text',
                tag: 'p',
                text: 'Secondary text block with enough length.',
                importanceScore: { value: 0.6 },
            }),
            contentElement({
                type: 'heading',
                tag: 'h1',
                text: 'Ignored heading with enough length',
                importanceScore: { value: 1 },
            }),
            contentElement({
                type: 'text',
                tag: 'p',
                text: 'Primary text block with enough length.',
                importanceScore: { value: 0.9 },
            }),
            contentElement({
                type: 'text',
                tag: 'p',
                text: 'Short',
                importanceScore: { value: 0.8 },
            }),
        ];

        // When
        const texts = semSampleTexts(content, 20, 1);

        // Then
        expect(texts).toEqual(['Text: Primary text block with enough length.']);
    });

    it('returns an empty array when there are no long enough text blocks', () => {
        expect(semSampleTexts([contentElement({ type: 'text', tag: 'p', text: 'Short' })], 20)).toEqual([]);
    });
});

describe('semSampleInteractions', () => {
    it('formats labeled or text interactions sorted by importance and limited by interactionsLimit', () => {
        // Given
        const interactive = [
            interactiveElement({
                role: 'button',
                text: 'Start',
                importanceScore: { value: 0.6 },
            }),
            interactiveElement({
                role: 'link',
                type: 'link',
                text: 'Docs',
                importanceScore: { value: 0.9 },
            }),
            interactiveElement({
                role: 'button',
                text: undefined,
                labels: [],
                importanceScore: { value: 1 },
            }),
            interactiveElement({
                role: 'textbox',
                type: 'input',
                text: undefined,
                labels: [{ source: 'aria-label', value: 'Search' }],
                importanceScore: { value: 0.8 },
            }),
        ];

        // When
        const interactions = semSampleInteractions(interactive, 2);

        // Then
        expect(interactions).toEqual([
            'Link. Name: Docs. Action: click action',
            'Text input. Name: Search. Action: input text',
        ]);
    });

    it('returns an empty array when interactions have no labels or text', () => {
        expect(
            semSampleInteractions([
                interactiveElement({
                    text: undefined,
                    labels: [],
                }),
            ]),
        ).toEqual([]);
    });
});

describe('semSampleStructure', () => {
    it('formats sampled containers in tree order limited within each sibling list', () => {
        // Given
        const structure = [
            containerNode('Sidebar', 0.4, 'sidebar'),
            containerNode('Main', 0.9, 'main content', [
                containerNode('Secondary', 0.5),
                containerNode('Primary', 0.8),
                containerNode('Ignored', 0.1),
            ]),
            containerNode('Footer', 0.2, 'footer'),
        ];

        // When
        const sample = semSampleStructure(structure, 2, 2);

        // Then
        expect(sample).toEqual([
            { depth: 0, text: 'Sidebar. Name: Sidebar' },
            { depth: 0, text: 'Main content. Name: Main' },
            { depth: 1, text: 'Section. Name: Secondary' },
            { depth: 1, text: 'Section. Name: Primary' },
        ]);
    });

    it('stops after maxDepth', () => {
        expect(
            semSampleStructure(
                [
                    containerNode('Main', 1, 'main content', [
                        containerNode('Included', 1, 'section', [containerNode('Too deep', 1)]),
                    ]),
                ],
                1,
            ),
        ).toEqual([
            { depth: 0, text: 'Main content. Name: Main' },
            { depth: 1, text: 'Section. Name: Included' },
        ]);
    });
});

function containerNode(
    name: string,
    meaningScore: number,
    role: ContainerElement['role'] = 'section',
    nodes: ContainerTreeNode[] = [],
): ContainerTreeNode {
    return {
        element: containerElement({
            role,
            labels: [{ source: 'aria-label', value: name }],
            meaningScore: { value: meaningScore },
        }),
        nodes,
    };
}
