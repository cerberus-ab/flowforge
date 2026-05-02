import { constants } from '#self/constants';
import type { ContentElement, InteractiveElement, PageBasics, PageModel } from '@flowforge/shared';

import { getElementLabels } from './extractors/primitive/label';
import { getInteractiveRole, roleToInteractiveElementType } from './extractors/primitive/role';
import { isAboveTheFold, isElementVisible, isInViewport } from './extractors/primitive/view';
import { getInteractiveElementState } from './extractors/primitive/state';
import { getElementText } from './extractors/primitive/text';
import { getElementLink } from './extractors/primitive/link';
import { getElementContext } from './extractors/context';
import { extractElementDescriptor } from './extractors/descriptor';
import { isSensitiveElement } from './extractors/primitive/sensitive';
import { scoreContentElement, scoreInteractiveElement } from './extractors/scoring';

/**
 * Collects a normalized PageModel from the DOM
 *
 * Extracts page metadata, content, and interactive elements, and assigns
 * stable `dataId` identifiers to elements for downstream usage.
 */
export class PageModelCollector {
    private readonly window: Window;
    private readonly document: Document;

    // TODO: configurable options instead of constants inside
    // TODO: move to packages/ as a separated package
    constructor(window: Window, document: Document) {
        this.window = window;
        this.document = document;
    }

    collect(): PageModel {
        const basics = this.collectPageModelBasics();

        return {
            basics,
            content: this.collectPageModelContent(basics),
            interactive: this.collectPageModelInteractive(basics),
            timestamp: Date.now(),
        };
    }

    // shortcut for common usage
    static collectFor(window: Window, document: Document) {
        return new PageModelCollector(window, document).collect();
    }

    /**
     * Collect basic page metadata from the current document
     *
     * @returns Page URL, title, description, and language.
     */
    private collectPageModelBasics(): PageBasics {
        return {
            url: this.window.location.href,
            title: this.document.title,
            description:
                (this.document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content ?? '',
            language: this.document.documentElement.lang ?? 'en',
            viewport: {
                width: this.window.innerWidth,
                height: this.window.innerHeight,
                scrollY: this.window.scrollY,
                scrollHeight: this.document.documentElement.scrollHeight,
            },
        };
    }

    /**
     * Collect visible text content elements from the page
     *
     * Scans common content tags and returns normalized entries that include
     * locator metadata, content type, and extracted text.
     *
     * @param basics - Page basics data extracted from the document.
     * @returns {ContentElement[]} A list of extracted content elements.
     */
    private collectPageModelContent(basics: PageBasics): ContentElement[] {
        const allElements: ContentElement[] = [];
        const contentSelectors = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption';

        this.document.querySelectorAll(contentSelectors).forEach((el) => {
            // skip hidden text blocks
            if (!isElementVisible(el, this.window)) return;
            // skip too small text blocks
            const text = getElementText(el);
            if (!text || text.length < constants.CONTENT_MIN_TEXT_LENGTH) return;

            const desc = extractElementDescriptor(el);
            const element: ContentElement = {
                ...desc,
                context: getElementContext(el, this.document),
                type: /^h[1-4]$/i.test(el.tagName) ? 'heading' : 'text',
                text,
                importanceScore: 0, // set up later
            };
            element.importanceScore = scoreContentElement(element);
            allElements.push(element);
        });
        if (allElements.length > constants.CONTENT_ELEMENTS_LIMIT) {
            console.log(
                `[FlowForge] Content elements limit exceeded (${allElements.length} > ${constants.CONTENT_ELEMENTS_LIMIT}). Applying top-N filtering after scoring.`,
            );
        }
        return allElements
            .sort((a, b) => b.importanceScore - a.importanceScore)
            .slice(0, constants.CONTENT_ELEMENTS_LIMIT);
    }

    /**
     * Collect interactive elements from the page
     *
     * Scans common native and ARIA-based interactive elements, filters out
     * hidden or unsupported nodes, and returns structured metadata including
     * locator info, role, type, text, labels, state, and link target.
     *
     * @param basics - Page basics data extracted from the document.
     * @returns {InteractiveElement[]} A list of extracted interactive elements.
     */
    private collectPageModelInteractive(basics: PageBasics): InteractiveElement[] {
        const allElements: InteractiveElement[] = [];

        const interactiveSelector =
            'button, a[href], input, textarea, select, summary' +
            ', [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="slider"]';

        this.document.querySelectorAll(interactiveSelector).forEach((el) => {
            // skip hidden elements
            if (!isElementVisible(el, this.window)) return;
            // skip sensitive elements
            if (isSensitiveElement(el)) return;
            // skip elements with no resolved role (by ARIA or implicitly)
            const role = getInteractiveRole(el);
            if (!role) return;
            // skip elements with no resolved type
            const type = roleToInteractiveElementType(role);
            if (!type) return;

            const desc = extractElementDescriptor(el);
            const element: InteractiveElement = {
                ...desc,
                context: getElementContext(el, this.document),
                type,
                role,
                text: getElementText(el),
                labels: getElementLabels(el, this.document),
                state: getInteractiveElementState(el),
                link: getElementLink(el),
                inViewport: isInViewport(desc.bbox, basics.viewport),
                aboveTheFold: isAboveTheFold(desc.bbox, basics.viewport),
                importanceScore: 0, // set up later
            };
            element.importanceScore = scoreInteractiveElement(element);
            allElements.push(element);
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
}
