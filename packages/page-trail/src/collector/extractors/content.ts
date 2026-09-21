import { topElements } from '../scoring/topEl.ts';
import type { ContentElement, ElementId, Scoring } from '../../types/index.ts';
import { scoreContentMeaning, scoreTargetImportance } from '../scoring/index.ts';
import { SELECTOR_CONTENT } from '../selectors.ts';
import { getElementBoundingBox, isElementVisible } from './primitive/view.ts';
import { ContainerTree } from './ContainerTree.ts';
import { extractContentElementContext } from './context.ts';
import { getElementText } from './primitive/text.ts';
import type { ElementLocatorCreator } from '../ElementLocatorCreator.ts';
import { type ExtractedElement, ExtractedElements } from './ExtractedElements.ts';

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
 * @returns {ExtractedElements<ContentElement>} A container of extracted content elements.
 */
export function extractContentElements(
    win: Window,
    root: Element,
    nextId: () => ElementId,
    elementLocatorCreator: ElementLocatorCreator | undefined,
    containerTree: ContainerTree,
    options: ExtractContentElementsOptions,
): ExtractedElements<ContentElement> {
    const candidates: {
        el: Element;
        prefilled: Pick<ContentElement, 'id' | 'text' | 'type' | 'context' | 'meaningScore'>;
        importanceScore: Scoring;
    }[] = [];
    const matched = Array.from(root.querySelectorAll(SELECTOR_CONTENT));

    matched.forEach((el) => {
        // skip hidden text blocks
        if (!isElementVisible(el, win)) return;
        // skip too small text blocks
        const text = getElementText(el);
        if (!text || text.length < CONTENT_MIN_TEXT_LENGTH) return;

        // compute only necessary data for scoring the candidates
        const id = nextId();
        const type = /^h[1-4]$/i.test(el.tagName) ? 'heading' : 'text';
        const meaningScore = scoreContentMeaning({ type, text });
        const context = extractContentElementContext(containerTree, el, { type });
        const importanceScore = scoreTargetImportance({ meaningScore, contextScore: context.contextScore });

        candidates.push({
            el,
            prefilled: { id, text, type, context, meaningScore },
            importanceScore,
        });
    });

    const tops = topElements(
        candidates,
        options.elementsLimit,
        // continue to compute only for return elements
        ({ el, prefilled, importanceScore }): ExtractedElement<ContentElement> => ({
            el,
            data: {
                ...prefilled,
                locator: elementLocatorCreator?.createFor(el),
                tag: el.tagName.toLowerCase(),
                kind: 'content',
                bbox: getElementBoundingBox(el),
                importanceScore,
            },
        }),
    );

    return new ExtractedElements(tops.data, matched.length, candidates.length, tops.limitReached);
}
