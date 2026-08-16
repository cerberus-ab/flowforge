import { topElements, type TopElements } from '../importance/topEl.ts';
import type { InteractiveElement, PageBasics } from '../../types/index.ts';
import { type InteractiveElementScoringData, scoreInteractiveElement } from '../importance/interactive.ts';
import { SELECTOR_INTERACTIVE } from '../selectors.ts';
import { getElementBoundingBox, isAboveTheFold, isElementVisible, isInViewport } from './primitive/view.ts';
import { isSensitiveElement } from './primitive/sensitive.ts';
import { getInteractiveRole, roleToInteractiveElementType } from './primitive/role.ts';
import { getInteractiveElementLabels } from './primitive/label.ts';
import { getElementText } from './primitive/text.ts';
import { getInteractiveElementState } from './primitive/state.ts';
import { getElementContext } from '../context/context.ts';
import { getCssSelector } from './primitive/selector.ts';
import { getElementLink } from './primitive/link.ts';
import type { ElementRegistry } from '../ElementRegistry.ts';

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
    options: ExtractInteractiveElementsOptions,
): TopElements<InteractiveElement> {
    const candidates: { el: Element; scoringData: InteractiveElementScoringData; importanceScore: number }[] = [];

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
        const scoringData: InteractiveElementScoringData = {
            role,
            type,
            labels: getInteractiveElementLabels(el),
            text: getElementText(el),
            state: getInteractiveElementState(el),
            context: getElementContext(el),
            bbox: getElementBoundingBox(el),
        };
        candidates.push({
            el,
            scoringData: scoringData,
            importanceScore: scoreInteractiveElement(scoringData),
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
            kind: 'interactive',
            link: getElementLink(el),
            inViewport: isInViewport(scoringData.bbox, basics.viewport),
            aboveTheFold: isAboveTheFold(scoringData.bbox, basics.viewport),
            importanceScore,
        }),
    );
}
