import type { ContentElement, ElementIdentifier, InteractiveElement, PageBasics, PageTrail } from '../types/index.ts';

import { getElementLabels } from './extractors/primitive/label.ts';
import { getInteractiveRole, roleToInteractiveElementType } from './extractors/primitive/role.ts';
import { getElementBoundingBox, isAboveTheFold, isElementVisible, isInViewport } from './extractors/primitive/view.ts';
import { getInteractiveElementState } from './extractors/primitive/state.ts';
import { getElementText } from './extractors/primitive/text.ts';
import { getElementLink } from './extractors/primitive/link.ts';
import { getElementContext } from './extractors/context.ts';
import { isSensitiveElement } from './extractors/primitive/sensitive.ts';
import { scoreContentElement, scoreInteractiveElement } from './importance/scoring.ts';
import { type TopElements, topElements } from './importance/topEl.ts';
import type { InteractiveElementScoringData } from './importance/interactive.ts';
import type { ContentElementScoringData } from './importance/content.ts';
import { normalizeText } from '../utils/index.ts';

// constants
const CONTENT_MIN_TEXT_LENGTH = 5;

export interface CollectorOptions {
    contentElementsLimit?: number;
    interactiveElementsLimit?: number;
    getElementDataId: (el: Element) => string;
    // For example: css-selector-generator
    getElementCssSelector?: (el: Element) => string;
}

type ResolvedCollectorOptions =
    Required<Pick<CollectorOptions, 'contentElementsLimit' | 'interactiveElementsLimit'>> &
    Pick<CollectorOptions, 'getElementDataId' | 'getElementCssSelector'>;

/**
 * Collects a normalized PageTrail from the DOM
 *
 * TODO: implement a cache, but with dataId ref consistency
 * TODO: provide a plugins API to extend the collector
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
    private readonly options: ResolvedCollectorOptions;

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
        const t0 = performance.now();

        const basics = this.collectPageBasics();
        const topContentElements = this.collectPageContent();
        const topInteractiveElements = this.collectPageInteractive(basics);

        return {
            basics,
            content: topContentElements.data,
            interactive: topInteractiveElements.data,

            metadata: {
                contentElements: topContentElements.data.length,
                contentElementsTotal: topContentElements.total,
                contentElementsLimitReached: topContentElements.limitReached,
                interactiveElements: topInteractiveElements.data.length,
                interactiveElementsTotal: topInteractiveElements.total,
                interactiveElementsLimitReached: topInteractiveElements.limitReached,
                // timings
                collectedAt: Date.now(),
                durationMs: Math.round(performance.now() - t0),
            },
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
            title: normalizeText(this.document.title),
            description: normalizeText(
                (this.document.querySelector('meta[name="description"]') as HTMLMetaElement | null)?.content ?? '',
            ),
            language: normalizeText(this.document.documentElement.lang) ?? 'en',
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
     * @returns {TopElements<ContentElement>} A container of extracted content elements.
     */
    private collectPageContent(): TopElements<ContentElement> {
        const candidates: { el: Element; scoringData: ContentElementScoringData; importanceScore: number }[] = [];

        const contentSelectors = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption';

        this.selectElements(contentSelectors).forEach((el) => {
            // skip hidden text blocks
            if (!isElementVisible(el, this.window)) return;
            // skip too small text blocks
            const text = getElementText(el);
            if (!text || text.length < CONTENT_MIN_TEXT_LENGTH) return;

            // compute only necessary data for scoring the candidates
            const scoringData: ContentElementScoringData = {
                text,
                type: /^h[1-4]$/i.test(el.tagName) ? 'heading' : 'text',
                context: getElementContext(el, this.document),
            };
            candidates.push({
                el,
                scoringData: scoringData,
                importanceScore: scoreContentElement(scoringData),
            });
        });

        return topElements(
            candidates,
            this.options.contentElementsLimit,
            // continue to compute only for selected elements
            ({ el, scoringData, importanceScore }) => ({
                ...scoringData,
                ...this.getElementIdentifier(el),
                tag: el.tagName.toLowerCase(),
                kind: 'content',
                bbox: getElementBoundingBox(el),
                importanceScore,
            }),
        );
    }

    /**
     * Collect interactive elements from the page
     *
     * Scans common native and ARIA-based interactive elements, filters out
     * hidden or unsupported nodes, and returns structured metadata including
     * locator info, role, type, text, labels, state, and link target.
     *
     * @param basics - Page basics data extracted from the document.
     * @returns {TopElements<InteractiveElement>} A container of extracted interactive elements.
     */
    private collectPageInteractive(basics: PageBasics): TopElements<InteractiveElement> {
        const candidates: { el: Element; scoringData: InteractiveElementScoringData; importanceScore: number }[] = [];

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

            // compute only necessary data for scoring the candidates
            const scoringData: InteractiveElementScoringData = {
                role,
                type,
                labels: getElementLabels(el, this.document),
                text: getElementText(el),
                state: getInteractiveElementState(el),
                context: getElementContext(el, this.document),
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
            this.options.interactiveElementsLimit,
            // continue to compute only for selected elements
            ({ el, scoringData, importanceScore }) => ({
                ...scoringData,
                ...this.getElementIdentifier(el),
                tag: el.tagName.toLowerCase(),
                kind: 'interactive',
                link: getElementLink(el),
                inViewport: isInViewport(scoringData.bbox, basics.viewport),
                aboveTheFold: isAboveTheFold(scoringData.bbox, basics.viewport),
                importanceScore,
            }),
        );
    }

    /**
     * Selects all elements matching the given CSS selector.
     *
     * @param selector CSS selector used to query elements.
     * @returns List of matching elements.
     */
    private selectElements(selector: string): Element[] {
        return Array.from(this.document.querySelectorAll(selector));
    }

    /**
     * Returns an identifier for a DOM element for later lookup or matching.
     *
     * The identifier includes the required `dataId` and, when available,
     * an additional CSS selector as a fallback.
     *
     * @param el DOM element to identify.
     * @returns Element identifier data.
     */
    private getElementIdentifier(el: Element): ElementIdentifier {
        return {
            dataId: this.options.getElementDataId(el),
            cssSelector: this.options.getElementCssSelector?.(el),
        };
    }
}
