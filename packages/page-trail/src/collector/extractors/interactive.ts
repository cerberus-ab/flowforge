import { topElements, type TopElements } from '../scoring/topEl.ts';
import type { InteractiveElement, PageBasics, Scoring } from '../../types/index.ts';
import { scoreInteractiveMeaning, scoreTargetImportance } from '../scoring/index.ts';
import { SELECTOR_INTERACTIVE } from '../selectors.ts';
import { getElementBoundingBox, isAboveTheFold, isElementVisible, isInViewport } from './primitive/view.ts';
import { isSensitiveElement } from './primitive/sensitive.ts';
import { getInteractiveRole, roleToInteractiveElementType } from './primitive/role.ts';
import { getInteractiveElementLabels } from './primitive/label.ts';
import { getInteractiveElementState } from './primitive/state.ts';
import { getCssSelector } from './primitive/selector.ts';
import { getElementLink } from './primitive/link.ts';
import type { ElementRegistry } from '../ElementRegistry.ts';
import { ContainerTree } from './ContainerTree.ts';
import { extractInteractiveElementContext } from './context.ts';
import { getElementText } from './primitive/text.ts';

// constants
const TEXT_CONTENT_MAX_LENGTH = 240;

interface ExtractInteractiveElementsOptions {
    elementsLimit: number;
}

/**
 * Collect interactive elements from the page
 *
 * Scans common native and ARIA-based interactive elements, filters out
 * hidden or unsupported nodes, and returns structured metadata including
 * locator info, role, type, text, labels, state, and link target.
 *
 * @returns {TopElements<InteractiveElement>} A container of extracted interactive elements.
 */
export function extractInteractiveElements(
    win: Window,
    root: Element,
    elementRegistry: ElementRegistry,
    basics: PageBasics,
    containerTree: ContainerTree,
    options: ExtractInteractiveElementsOptions,
): TopElements<InteractiveElement> {
    const candidates: {
        el: Element;
        prefilled: Pick<
            InteractiveElement,
            'role' | 'type' | 'labels' | 'text' | 'state' | 'bbox' | 'meaningScore' | 'context'
        >;
        importanceScore: Scoring;
    }[] = [];

    Array.from(root.querySelectorAll(SELECTOR_INTERACTIVE)).forEach((el) => {
        // skip hidden elements
        if (!isElementVisible(el, win)) return;
        // skip sensitive elements
        if (isSensitiveElement(el)) return;
        // skip elements with no resolved role (by ARIA or implicitly)
        const role = getInteractiveRole(el);
        if (!role) return;
        // skip elements with no resolved type
        const type = roleToInteractiveElementType(role);
        if (!type) return;

        // compute only necessary data for scoring the candidates
        const labels = getInteractiveElementLabels(el);
        const text = getElementText(el, { maxLength: TEXT_CONTENT_MAX_LENGTH });
        const state = getInteractiveElementState(el);
        const bbox = getElementBoundingBox(el);
        const meaningScore = scoreInteractiveMeaning({ role, type, labels, text, state, bbox });
        const context = extractInteractiveElementContext(containerTree, el, { role, type });
        const importanceScore = scoreTargetImportance({ meaningScore, contextScore: context.contextScore });

        candidates.push({
            el,
            prefilled: { role, type, labels, text, state, bbox, meaningScore, context },
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
            kind: 'interactive',
            link: getElementLink(el),
            inViewport: isInViewport(prefilled.bbox, basics.viewport),
            aboveTheFold: isAboveTheFold(prefilled.bbox, basics.viewport),
            importanceScore,
        }),
    );
}
