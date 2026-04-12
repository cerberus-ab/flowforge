import { getElementLabels } from './extractors/primitive/label';
import { getInteractiveRole, roleToInteractiveElementType } from './extractors/primitive/role';
import { isElementVisible } from './extractors/primitive/view';
import { getInteractiveElementState } from './extractors/primitive/state';
import { getElementText } from './extractors/primitive/text';
import { constants } from './constants';
import { getElementLink } from './extractors/primitive/link';
import type { ContentElement, InteractiveElement, PageBasics, PageData } from '@flowforge/shared';
import { getElementContext } from './extractors/context';
import { extractElementLocator } from './extractors/locator';
import { isSensitiveElement } from '#self/core/extractors/primitive/sensitive';
import { scoreContentElement, scoreInteractiveElement } from '#self/core/extractors/scoring';

/**
 * Collect basic page metadata from the current document
 *
 * @returns Page URL, title, description, and language.
 */
function collectPageDataBasics(): PageBasics {
    return {
        url: window.location.href,
        title: document.title,
        description: (document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content ?? '',
        language: document.documentElement.lang ?? 'en',
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollY: window.scrollY,
            scrollHeight: document.documentElement.scrollHeight,
        },
    };
}

/**
 * Collect visible text content elements from the page
 *
 * Scans common content tags and returns normalized entries that include
 * locator metadata, content type, and extracted text.
 *
 * @returns {ContentElement[]} A list of extracted content elements.
 */
function collectPageDataContent(): ContentElement[] {
    const allElements: ContentElement[] = [];
    const contentSelectors = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption';

    document.querySelectorAll(contentSelectors).forEach((el) => {
        // skip hidden text blocks
        if (!isElementVisible(el)) return;
        // skip too small text blocks
        const text = getElementText(el);
        if (!text || text.length < constants.CONTENT_MIN_TEXT_LENGTH) return;

        const context = getElementContext(el);
        const type = /^h[1-4]$/i.test(el.tagName) ? 'heading' : 'text';
        const score = scoreContentElement(text, type, context);

        allElements.push({
            ...extractElementLocator(el),
            context,
            importanceScore: score,
            type,
            text,
        });
    });
    if (allElements.length > constants.CONTENT_ELEMENTS_LIMIT) {
        console.log(
            `[FlowForge] Content elements limit exceeded (${allElements.length} > ${constants.CONTENT_ELEMENTS_LIMIT}). Applying top-N filtering after scoring.`,
        );
    }
    return allElements.sort((a, b) => b.importanceScore - a.importanceScore).slice(0, constants.CONTENT_ELEMENTS_LIMIT);
}

/**
 * Collect interactive elements from the page
 *
 * Scans common native and ARIA-based interactive elements, filters out
 * hidden or unsupported nodes, and returns structured metadata including
 * locator info, role, type, text, labels, state, and link target.
 *
 * @returns {InteractiveElement[]} A list of extracted interactive elements.
 */
function collectPageDataInteractive(): InteractiveElement[] {
    const allElements: InteractiveElement[] = [];

    const interactiveSelector =
        'button, a[href], input, textarea, select, summary' +
        ', [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="slider"]';

    document.querySelectorAll(interactiveSelector).forEach((el) => {
        // skip hidden elements
        if (!isElementVisible(el)) return;
        // skip sensitive elements
        if (isSensitiveElement(el)) return;
        // skip elements with no resolved role (by ARIA or implicitly)
        const role = getInteractiveRole(el);
        if (!role) return;
        // skip elements with no resolved type
        const type = roleToInteractiveElementType(role);
        if (!type) return;

        const context = getElementContext(el);
        const text = getElementText(el);
        const labels = getElementLabels(el);
        const state = getInteractiveElementState(el);
        const score = scoreInteractiveElement(role, labels, text, state, context);

        allElements.push({
            ...extractElementLocator(el),
            context,
            importanceScore: score,
            type,
            role,
            text,
            labels,
            state,
            link: getElementLink(el),
        });
    });
    if (allElements.length > constants.INTERACTIVE_ELEMENTS_LIMIT) {
        console.log(
            `[FlowForge] Interactive elements limit exceeded (${allElements.length} > ${constants.INTERACTIVE_ELEMENTS_LIMIT}). Applying top-N filtering after scoring.`,
        );
    }
    return allElements
        .sort((a, b) => b.importanceScore - a.importanceScore)
        .slice(0, constants.INTERACTIVE_ELEMENTS_LIMIT);
}

/**
 * Collect all page data
 * TODO: create a configurable service
 */
export function collectPageData(): PageData {
    return {
        basics: collectPageDataBasics(),
        content: collectPageDataContent(),
        interactive: collectPageDataInteractive(),
        timestamp: Date.now(),
    };
}
