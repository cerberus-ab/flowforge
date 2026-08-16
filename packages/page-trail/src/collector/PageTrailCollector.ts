import type { ContentElement, InteractiveElement, PageBasics, PageTrail } from '../types/index.ts';

import { type TopElements } from './importance/topEl.ts';
import { ContainerTree } from './extractors/ContainerTree.ts';
import { ElementRegistry } from './ElementRegistry.ts';
import { extractContentElements } from './extractors/content.ts';
import { extractPageBasics } from './extractors/basics.ts';
import { extractInteractiveElements } from './extractors/interactive.ts';

export interface CollectorOptions {
    /** Maximum number of content elements to keep after importance scoring. */
    contentElementsLimit?: number;
    /** Maximum number of interactive elements to keep after importance scoring. */
    interactiveElementsLimit?: number;
    /** Returns the stable identifier used to link extracted records back to DOM elements. */
    getElementDataId: (el: Element) => string;
}

type ResolvedCollectorOptions = Required<Pick<CollectorOptions, 'contentElementsLimit' | 'interactiveElementsLimit'>> &
    Pick<CollectorOptions, 'getElementDataId'>;

/**
 * Orchestrates PageTrail extraction for a document.
 *
 * TODO: implement a cache, but with dataId ref consistency
 * TODO: provide a plugins API to extend the collector
 *
 * The collector owns shared extraction state, delegates DOM scanning to
 * specialized extractors, and combines their results into a normalized
 * `PageTrail` with collection metadata.
 */
export class PageTrailCollector {
    private readonly window: Window;
    private readonly document: Document;
    private readonly options: ResolvedCollectorOptions;
    private readonly elementRegistry: ElementRegistry;

    constructor(win: Window, doc: Document, options: CollectorOptions) {
        this.window = win;
        this.document = doc;

        this.options = {
            contentElementsLimit: 250,
            interactiveElementsLimit: 150,
            ...options,
        };
        this.elementRegistry = new ElementRegistry(this.options.getElementDataId);
    }

    collect(): PageTrail {
        const t0 = performance.now();

        const basics = this.collectPageBasics();
        const t1_basics = performance.now();

        const containerTree = this.collectContainerTree();
        const t2_container = performance.now();

        const topContentElements = this.collectContentElements();
        const t3_content = performance.now();

        const topInteractiveElements = this.collectInteractiveElements(basics);
        const t4_interactive = performance.now();

        return {
            basics,
            container: containerTree.nodes,
            content: topContentElements.data,
            interactive: topInteractiveElements.data,

            metadata: {
                containerElements: containerTree.elements.length,
                containerMaxDepth: containerTree.getMathDepth(),
                contentElements: topContentElements.data.length,
                contentElementsTotal: topContentElements.total,
                contentElementsLimitReached: topContentElements.limitReached,
                interactiveElements: topInteractiveElements.data.length,
                interactiveElementsTotal: topInteractiveElements.total,
                interactiveElementsLimitReached: topInteractiveElements.limitReached,
                // timings
                collectedAt: Date.now(),
                performance: {
                    basicsMs: Math.round(t1_basics - t0),
                    containerMs: Math.round(t2_container - t1_basics),
                    contentMs: Math.round(t3_content - t2_container),
                    interactiveMs: Math.round(t4_interactive - t3_content),
                    totalMs: Math.round(t4_interactive - t0),
                },
            },
        };
    }

    /**
     * Collects a `PageTrail` for the provided window/document pair.
     */
    static collectFor(win: Window, doc: Document, options: CollectorOptions): PageTrail {
        return new PageTrailCollector(win, doc, options).collect();
    }

    private collectPageBasics(): PageBasics {
        return extractPageBasics(this.window, this.document);
    }

    private collectContainerTree(): ContainerTree {
        return ContainerTree.extractFor(this.window, this.document, this.elementRegistry);
    }

    private collectContentElements(): TopElements<ContentElement> {
        return extractContentElements(this.window, this.document.body, this.elementRegistry, {
            elementsLimit: this.options.contentElementsLimit,
        });
    }

    private collectInteractiveElements(basics: PageBasics): TopElements<InteractiveElement> {
        return extractInteractiveElements(this.window, this.document.body, this.elementRegistry, basics, {
            elementsLimit: this.options.interactiveElementsLimit,
        });
    }
}
