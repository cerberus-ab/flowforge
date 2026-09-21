import { describe, expect, it } from 'vitest';

import { createContentElementFixture } from '../../../test/fixtures';
import { ExtractedElements, type ExtractedElement } from './ExtractedElements';

function extractedElement(id: number): ExtractedElement<ReturnType<typeof createContentElementFixture>> {
    return {
        el: document.createElement('p'),
        data: createContentElementFixture({ id }),
    };
}

describe('ExtractedElements', () => {
    it('reports matched, candidate, and selected element counts', () => {
        // Given
        const selected = [extractedElement(1), extractedElement(2)];

        // When
        const elements = new ExtractedElements(selected, 5, 3, true);

        // Then
        expect(elements.matched).toBe(5);
        expect(elements.candidates).toBe(3);
        expect(elements.length).toBe(2);
        expect(elements.limitReached).toBe(true);
    });

    it('returns selected element data in order through a new array', () => {
        // Given
        const first = extractedElement(1);
        const second = extractedElement(2);
        const elements = new ExtractedElements([first, second], 2, 2);

        // When
        const data = elements.elements();
        data.length = 0;

        // Then
        expect(elements.elements()).toEqual([first.data, second.data]);
        expect(elements.limitReached).toBe(false);
    });

    it('iterates over selected DOM element records in order', () => {
        // Given
        const first = extractedElement(1);
        const second = extractedElement(2);
        const elements = new ExtractedElements([first, second], 2, 2);

        // When
        const records = [...elements];

        // Then
        expect(records).toEqual([first, second]);
        expect(records[0]).toBe(first);
        expect(records[1]).toBe(second);
    });
});
