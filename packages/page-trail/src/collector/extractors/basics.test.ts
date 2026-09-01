import { afterEach, describe, expect, it } from 'vitest';

import { resetDocument, setViewport } from '../../../test/domUtils';
import { extractPageBasics } from './basics';

afterEach(() => {
    resetDocument();
});

describe('extractPageBasics', () => {
    it('extracts normalized page metadata and viewport data', () => {
        // Given
        document.documentElement.lang = ' en ';
        document.head.innerHTML = `<meta name="description" content=" Page   description " />`;
        document.title = ' Test   page ';
        setViewport({ width: 1024, height: 768, scrollY: 100, scrollHeight: 2000 });

        // When
        const basics = extractPageBasics(window, document);

        // Then
        expect(basics).toEqual({
            url: 'http://localhost:3000/',
            title: 'Test page',
            description: 'Page description',
            language: 'en',
            viewport: {
                width: 1024,
                height: 768,
                scrollY: 100,
                scrollHeight: 2000,
            },
        });
    });
});
