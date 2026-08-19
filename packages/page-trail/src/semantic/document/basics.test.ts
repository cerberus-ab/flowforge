import { describe, expect, it } from 'vitest';

import { contentElement, interactiveElement } from '../../../test/fixtures';
import { semSampleHeadings, semSampleInteractions } from './basics';

describe('semSampleHeadings', () => {
    it('formats headings sorted by importance and limited by headingsLimit', () => {
        expect(
            semSampleHeadings(
                [
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
                ],
                2,
            ),
        ).toBe('Heading h1: Welcome | Heading h2: Features');
    });

    it('returns an empty string when there are no headings', () => {
        expect(semSampleHeadings([contentElement({ type: 'text', tag: 'p', text: 'Body' })])).toBe('');
    });
});

describe('semSampleInteractions', () => {
    it('formats labeled or text interactions sorted by importance and limited by interactionsLimit', () => {
        expect(
            semSampleInteractions(
                [
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
                ],
                2,
            ),
        ).toBe('Link. Name: Docs. Action: click action | Text input. Name: Search. Action: input text');
    });

    it('returns an empty string when interactions have no labels or text', () => {
        expect(
            semSampleInteractions([
                interactiveElement({
                    text: undefined,
                    labels: [],
                }),
            ]),
        ).toBe('');
    });
});
