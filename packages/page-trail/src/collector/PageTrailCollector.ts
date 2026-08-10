import type { ContentElement, InteractiveElement, PageBasics, PageTrail } from '../types/index.ts';

import { getElementLabels } from './extractors/primitive/label.ts';
import { getInteractiveRole, roleToInteractiveElementType } from './extractors/primitive/role.ts';
import { isAboveTheFold, isElementVisible, isInViewport } from './extractors/primitive/view.ts';
import { getInteractiveElementState } from './extractors/primitive/state.ts';
import { getElementText } from './extractors/primitive/text.ts';
import { getElementLink } from './extractors/primitive/link.ts';
import { getElementContext } from './extractors/context.ts';
import { extractElementDescriptor } from './extractors/descriptor.ts';
import { isSensitiveElement } from './extractors/primitive/sensitive.ts';
import { scoreContentElement, scoreInteractiveElement } from './importance/scoring.ts';
import { topElements } from './importance/topEl.ts';

// constants
const CONTENT_MIN_TEXT_LENGTH = 5;

export interface CollectorOptions {
    contentElementsLimit?: number;
    interactiveElementsLimit?: number;
    getElementDataId: (el: Element) => string;
}

/**
 * Collects a normalized PageTrail from the DOM
 *
 * TODO: implement a cache, but with dataId ref consistency
 * TODO: provide a plugins API to extend the collector
 * TODO: provide metrics on the model collection
 *
 * Extracts page metadata, content, and interactive elements, and assigns
 * stable `dataId` identifiers to elements for downstream usage.
 */
export class PageTrailCollector {
    // window.location.href - reads the current page URL
    // window.innerWidth - reads viewport width
    // window.innerHeight - reads viewport height
    // window.scrollY - reads current vertical scroll position
    // window.getComputedStyle(element) - checks computed CSS styles for visibility
    private readonly window: Window;
    // document.title - reads the page title
    // document.querySelector('meta[name="description"]') - finds the meta description element
    // document.documentElement.lang - reads the page language from <html lang="...">
    // document.documentElement.scrollHeight - reads the full scrollable page height
    // document.querySelectorAll(selector) - finds content and interactive elements by CSS selector
    // document.getElementById(id) - resolves IDs from aria-labelledby to label elements
    // document.querySelector('label[for="..."]') - finds a <label> connected to an element by for
    private readonly document: Document;
    private readonly options: Required<CollectorOptions>;

    constructor(window: Window, document: Document, options: CollectorOptions) {
        this.window = window;
        this.document = document;

        this.options = {
            contentElementsLimit: 250,
            interactiveElementsLimit: 150,
            ...options,
        };
    }

    collect(): PageTrail {
        const basics = this.collectPageBasics();

        return {
            basics,
            content: this.collectPageContent(),
            interactive: this.collectPageInteractive(basics),
            timestamp: Date.now(),
        };
    }

    // shortcut for common usage
    static collectFor(window: Window, document: Document, options: CollectorOptions): PageTrail {
        return new PageTrailCollector(window, document, options).collect();
    }

    /**
     * Collect basic page metadata from the current document
     *
     * @returns Page URL, title, description, and language.
     */
    private collectPageBasics(): PageBasics {
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
     * @returns {ContentElement[]} A list of extracted content elements.
     */
    private collectPageContent(): ContentElement[] {
        const allElements: ContentElement[] = [];
        const contentSelectors = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption';

        this.selectElements(contentSelectors).forEach((el) => {
            // skip hidden text blocks
            if (!isElementVisible(el, this.window)) return;
            // skip too small text blocks
            const text = getElementText(el);
            if (!text || text.length < CONTENT_MIN_TEXT_LENGTH) return;

            const desc = extractElementDescriptor(el, this.options.getElementDataId);
            const element: ContentElement = {
                ...desc,
                context: getElementContext(el, this.document),
                kind: 'content',
                type: /^h[1-4]$/i.test(el.tagName) ? 'heading' : 'text',
                text,
                importanceScore: 0, // set up later
            };
            element.importanceScore = scoreContentElement(element);
            allElements.push(element);
        });
        return topElements(allElements, this.options.contentElementsLimit).data;
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
    private collectPageInteractive(basics: PageBasics): InteractiveElement[] {
        const allElements: InteractiveElement[] = [];

        const interactiveSelector =
            'button, a[href], input, textarea, select, summary' +
            ', [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="textbox"], [role="combobox"], [role="slider"]';

        this.selectElements(interactiveSelector).forEach((el) => {
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

            const desc = extractElementDescriptor(el, this.options.getElementDataId);
            const element: InteractiveElement = {
                ...desc,
                context: getElementContext(el, this.document),
                kind: 'interactive',
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
        return topElements(allElements, this.options.interactiveElementsLimit).data;
    }

    /**
     * TODO: consider to use TreeWalker and iterator instead
     *
     * @param selector
     * @returns List of elements
     */
    private selectElements(selector: string): Element[] {
        return Array.from(this.document.querySelectorAll(selector));
    }

}
