import { topElements, type TopElements } from '../scoring/topEl.ts';
import type { ContentElement, Scoring } from '../../types/index.ts';
import { scoreContentMeaning, scoreTargetImportance } from '../scoring/index.ts';
import { SELECTOR_CONTENT } from '../selectors.ts';
import { getElementBoundingBox, isElementVisible } from './primitive/view.ts';
import { getCssSelector } from './primitive/selector.ts';
import type { ElementRegistry } from '../ElementRegistry.ts';
import { ContainerTree } from './ContainerTree.ts';
import { extractContentElementContext } from './context.ts';
import { getElementText } from './primitive/text.ts';

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
    containerTree: ContainerTree,
    options: ExtractContentElementsOptions,
): TopElements<ContentElement> {
    const candidates: {
        el: Element;
        prefilled: Pick<ContentElement, 'text' | 'type' | 'context' | 'meaningScore'>;
        importanceScore: Scoring;
    }[] = [];

    Array.from(root.querySelectorAll(SELECTOR_CONTENT)).forEach((el) => {
        // skip hidden text blocks
        if (!isElementVisible(el, win)) return;
        // skip too small text blocks
        const text = getElementText(el);
        if (!text || text.length < CONTENT_MIN_TEXT_LENGTH) return;

        // compute only necessary data for scoring the candidates
        const type = /^h[1-4]$/i.test(el.tagName) ? 'heading' : 'text';
        const meaningScore = scoreContentMeaning({ type, text });
        const context = extractContentElementContext(containerTree, el, { type });
        const importanceScore = scoreTargetImportance({ meaningScore, contextScore: context.contextScore });

        candidates.push({
            el,
            prefilled: { text, type, context, meaningScore },
            importanceScore,
        });
    });

    return topElements(
        candidates,
        options.elementsLimit,
        // continue to compute only for selected elements
        ({ el, prefilled, importanceScore }) => ({
            ...prefilled,
            dataId: elementRegistry.register(el),
            cssSelector: getCssSelector(el),
            tag: el.tagName.toLowerCase(),
            kind: 'content',
            bbox: getElementBoundingBox(el),
            importanceScore,
        }),
    );
}
