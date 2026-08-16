import { topElements, type TopElements } from '../importance/topEl.ts';
import type { ContentElement } from '../../types/index.ts';
import { type ContentElementScoringData, scoreContentElement } from '../importance/content.ts';
import { SELECTOR_CONTENT } from '../selectors.ts';
import { getElementBoundingBox, isElementVisible } from './primitive/view.ts';
import { getElementText } from './primitive/text.ts';
import { getElementContext } from '../context/context.ts';
import { getCssSelector } from './primitive/selector.ts';
import type { ElementRegistry } from '../ElementRegistry.ts';

// constants
const CONTENT_MIN_TEXT_LENGTH = 5;

interface ExtractContentElementsOptions {
    elementsLimit: number;
}

/**
 * Collect visible text content elements from the page
 *
 * Scans common content tags and returns normalized entries that include
 * locator metadata, content type, and extracted text.
 *
 * @returns {TopElements<ContentElement>} A container of extracted content elements.
 */
export function extractContentElements(
    win: Window,
    root: Element,
    elementRegistry: ElementRegistry,
    options: ExtractContentElementsOptions,
): TopElements<ContentElement> {
    const candidates: { el: Element; scoringData: ContentElementScoringData; importanceScore: number }[] = [];

    Array.from(root.querySelectorAll(SELECTOR_CONTENT)).forEach((el) => {
        // skip hidden text blocks
        if (!isElementVisible(el, win)) return;
        // skip too small text blocks
        const text = getElementText(el);
        if (!text || text.length < CONTENT_MIN_TEXT_LENGTH) return;

        // compute only necessary data for scoring the candidates
        const scoringData: ContentElementScoringData = {
            text,
            type: /^h[1-4]$/i.test(el.tagName) ? 'heading' : 'text',
            context: getElementContext(el),
        };
        candidates.push({
            el,
            scoringData: scoringData,
            importanceScore: scoreContentElement(scoringData),
        });
    });

    return topElements(
        candidates,
        options.elementsLimit,
        // continue to compute only for selected elements
        ({ el, scoringData, importanceScore }) => ({
            ...scoringData,
            dataId: elementRegistry.register(el),
            cssSelector: getCssSelector(el),
            tag: el.tagName.toLowerCase(),
            kind: 'content',
            bbox: getElementBoundingBox(el),
            importanceScore,
        }),
    );
}
