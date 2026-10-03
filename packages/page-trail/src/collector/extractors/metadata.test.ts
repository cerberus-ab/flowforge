import { afterEach, describe, expect, it } from 'vitest';

import { resetDocument } from '../../../test/domUtils';
import { extractPageMetadata } from './metadata';

afterEach(() => {
    resetDocument();
});

describe('extractPageMetadata', () => {
    it('measures body text and serialized document HTML', () => {
        // Given
        document.body.innerHTML = '<main>Page content</main>';

        // When
        const metadata = extractPageMetadata(document);

        // Then
        expect(metadata.innerTextLength).toBe(document.body.innerText.length);
        expect(metadata.outerHtmlLength).toBe(document.documentElement.outerHTML.length);
    });
});
