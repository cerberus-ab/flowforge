import type {
    CollectionMetadata,
    ContainerElement,
    ContentElement,
    ElementId,
    InteractiveElement,
    PageBasics,
} from '../types/index.ts';

import { ContainerTree } from './extractors/index.ts';
import { ElementLocatorCreator } from './ElementLocatorCreator.ts';
import { extractContentElements } from './extractors/content.ts';
import { extractPageBasics } from './extractors/basics.ts';
import { extractInteractiveElements } from './extractors/index.ts';
import { nextIdGenerator } from '../utils/nextId.ts';
import type { ExtractedElements } from './extractors/ExtractedElements.ts';
import { extractContainerElements } from './extractors/container.ts';
import { PageTrail } from '../PageTrail.ts';
import { VERSION } from '../version.ts';

interface CollectorCommonOptions {
    /** Maximum number of content elements to keep after importance scoring. */
    contentElementsLimit?: number;
    /** Maximum number of interactive elements to keep after importance scoring. */
    interactiveElementsLimit?: number;
}

type CollectorModeOptions =
    | {
          /** Collects page context without linking elements back to the DOM. */
          contextOnly: true;
          getElementDataId?: never;
      }
    | {
          /** Collects page context with locators that link elements back to the DOM. */
          contextOnly?: false;
          getElementDataId: (el: Element) => string;
      };

export type CollectorOptions = CollectorCommonOptions & CollectorModeOptions;

type ResolvedCollectorModeOptions =
    { contextOnly: true; getElementDataId?: never } | { contextOnly: false; getElementDataId: (el: Element) => string };

type ResolvedCollectorOptions = Required<CollectorCommonOptions> & ResolvedCollectorModeOptions;

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
    private readonly nextId: () => ElementId;
    private readonly elementLocatorCreator: ElementLocatorCreator | undefined;

    constructor(win: Window, doc: Document, options: CollectorOptions) {
        this.window = win;
        this.document = doc;

        this.options = {
            contextOnly: false,
            contentElementsLimit: 250,
            interactiveElementsLimit: 150,
            ...options,
        };
        this.nextId = nextIdGenerator();
        this.elementLocatorCreator = this.options.contextOnly
            ? undefined
            : new ElementLocatorCreator(this.options.getElementDataId);
    }

    collect(): PageTrail {
        const t0 = performance.now();
        // collect basics
        const basics = this.collectPageBasics();
        const t1_basics = performance.now();
        // collect containers and build the structure
        const containerElements = this.collectContainerElements();
        const containerTree = new ContainerTree(this.document.body, containerElements);
        const t2_structure = performance.now();
        // collect content elements
        const contentElements = this.collectContentElements(containerTree);
        const t3_content = performance.now();
        // collect interactive elements
        const interactiveElements = this.collectInteractiveElements(basics, containerTree);
        const t4_interactive = performance.now();
        // complete the structure
        for (const element of contentElements) {
            containerTree.addTarget(element.data);
        }
        for (const element of interactiveElements) {
            containerTree.addTarget(element.data);
        }
        const elements = [
            ...containerElements.elements(),
            ...contentElements.elements(),
            ...interactiveElements.elements(),
        ];
        const t5_complete = performance.now();

        const metadata: CollectionMetadata = {
            version: VERSION,
            // stats
            containerElements: containerElements.length,
            containerElementsSelected: containerElements.selected,
            containerElementsMaxDepth: containerTree.getMaxDepth(),
            contentElements: contentElements.length,
            contentElementsSelected: contentElements.selected,
            contentElementsCandidates: contentElements.candidates,
            contentElementsLimitReached: contentElements.limitReached,
            interactiveElements: interactiveElements.length,
            interactiveElementsSelected: interactiveElements.selected,
            interactiveElementsCandidates: interactiveElements.candidates,
            interactiveElementsLimitReached: interactiveElements.limitReached,
            // timings
            collectedAt: Date.now(),
            performance: {
                basicsMs: Math.round(t1_basics - t0),
                structureMs: Math.round(t2_structure - t1_basics),
                contentMs: Math.round(t3_content - t2_structure),
                interactiveMs: Math.round(t4_interactive - t3_content),
                completeMs: Math.round(t5_complete - t4_interactive),
                totalMs: Math.round(t5_complete - t0),
            },
        };

        return new PageTrail(this.options.contextOnly, basics, containerTree.structure, elements, metadata);
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

    private collectContainerElements(): ExtractedElements<ContainerElement> {
        return extractContainerElements(this.window, this.document.body, this.nextId, this.elementLocatorCreator);
    }

    private collectContentElements(containerTree: ContainerTree): ExtractedElements<ContentElement> {
        return extractContentElements(
            this.window,
            this.document.body,
            this.nextId,
            this.elementLocatorCreator,
            containerTree,
            {
                elementsLimit: this.options.contentElementsLimit,
            },
        );
    }

    private collectInteractiveElements(
        basics: PageBasics,
        containerTree: ContainerTree,
    ): ExtractedElements<InteractiveElement> {
        return extractInteractiveElements(
            this.window,
            this.document.body,
            this.nextId,
            this.elementLocatorCreator,
            basics,
            containerTree,
            {
                elementsLimit: this.options.interactiveElementsLimit,
            },
        );
    }
}
