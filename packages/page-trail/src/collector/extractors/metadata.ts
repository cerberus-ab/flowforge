import type { PageMetadata } from '../../types/index.ts';

/**
 * Measures rendered body text and serialized document HTML lengths.
 *
 * @param doc - Document to measure.
 * @returns Text and HTML lengths in UTF-16 code units.
 */
export function extractPageMetadata(doc: Document): PageMetadata {
    return {
        innerTextLength: doc.body.innerText.length,
        outerHtmlLength: doc.documentElement.outerHTML.length,
    };
}
