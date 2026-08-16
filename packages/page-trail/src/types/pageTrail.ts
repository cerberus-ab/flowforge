// Document Basics

export interface Viewport {
    width: number;
    height: number;
    scrollY: number;
    scrollHeight: number;
}

export interface PageBasics {
    url: string;
    title: string;
    description: string;
    language: string; // en by default
    viewport: Viewport;
}

// Element descriptors

export interface BoundingBox {
    top: number;
    left: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
}

// Container element and tree

export type ContainerElementRole =
    | 'alert dialog'
    | 'modal dialog'
    | 'dialog'
    | 'form'
    | 'navigation'
    | 'header'
    | 'main content'
    | 'footer'
    | 'sidebar'
    | 'search'
    | 'article'
    | 'section'
    | 'region'
    | 'figure'
    | 'feed'
    | 'note'
    | 'tab panel'
    | 'toolbar'
    | 'table'
    | 'table row'
    | 'menu';

export type ContainerElementLabelSource = 'aria-labelledby' | 'aria-label' | 'legend' | 'heading' | 'title';

export interface ContainerElementLabel {
    value: string;
    source: ContainerElementLabelSource;
}

export interface ContainerTreeNode extends ContainerElement {
    nodes: ContainerTreeNode[];
}

// Interactive element

export type InteractiveElementRole =
    | 'button'
    | 'link'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'slider'
    | 'textbox'
    | 'searchbox'
    | 'combobox'
    | 'listbox'
    | 'option'
    | 'tab'
    | 'menuitem'
    | 'dialog';

export type InteractiveElementLabelSource =
    | 'aria-labelledby'
    | 'aria-label'
    | 'label-for'
    | 'label-wrapper'
    | 'value'
    | 'placeholder'
    | 'alt'
    | 'title'
    | 'name';

export interface InteractiveElementLabel {
    value: string;
    source: InteractiveElementLabelSource;
}

export interface InteractiveElementState {
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    checked?: boolean;
    selected?: boolean;
    expanded?: boolean;
    pressed?: boolean;
    hidden?: boolean;
}

export type InteractiveLinkType = 'internal' | 'external' | 'anchor' | 'mailto' | 'tel' | 'unknown';

export interface InteractiveLink {
    type: InteractiveLinkType;
    href: string;
}

// Element Types

export type ElementDataId = string;

export type ElementKind = 'container' | 'content' | 'interactive';

export type ContainerElementType = 'dialog' | 'landmark' | 'navigation' | 'form' | 'section' | 'widget' | 'table';
export type ContentElementType = 'text' | 'heading';
export type InteractiveElementType = 'button' | 'input' | 'select' | 'link';

export interface BaseElement {
    tag: string;
    dataId: ElementDataId;
    cssSelector: string | undefined; // fallback
    kind: ElementKind;
    type: ContainerElementType | ContentElementType | InteractiveElementType;
    bbox: BoundingBox;
}

export interface ContextElement extends BaseElement {}

export interface ContainerElement extends ContextElement {
    kind: 'container';
    type: ContainerElementType;
    role: ContainerElementRole;
    labels: ContainerElementLabel[];
}

// @deprecated
export interface ElementContext {
    path: ContainerElementRole[];
    sectionName?: string;
}

export interface TargetElement extends BaseElement {
    context: ElementContext;
    importanceScore: number; // [0..1]
}

export interface ContentElement extends TargetElement {
    kind: 'content';
    type: ContentElementType;
    text: string;
}

export interface InteractiveElement extends TargetElement {
    kind: 'interactive';
    type: InteractiveElementType;
    role: InteractiveElementRole;
    text: string | undefined;
    labels: InteractiveElementLabel[];
    state: InteractiveElementState;
    link: InteractiveLink | undefined; // for links only
    inViewport: boolean;
    aboveTheFold: boolean;
}

export interface CollectionMetadata {
    containerElements: number;
    containerMaxDepth: number;
    contentElements: number;
    contentElementsTotal: number;
    contentElementsLimitReached: boolean;
    interactiveElements: number;
    interactiveElementsTotal: number;
    interactiveElementsLimitReached: boolean;
    // timings
    collectedAt: number; // timestamp
    performance: {
        basicsMs: number;
        containerMs: number;
        contentMs: number;
        interactiveMs: number;
        totalMs: number;
    };
}

/**
 * Canonical, normalized snapshot of a web page.
 *
 * `PageTrail` is derived from the DOM by extractors and acts as the central
 * structure consumed by downstream semantic formatting, indexing, retrieval,
 * and UI guidance stages.
 *
 * It abstracts away raw DOM complexity and provides a structured view of:
 * - page metadata and viewport data (`basics`)
 * - semantic containers tree (`container`)
 * - textual content blocks (`content`)
 * - interactive UI elements (`interactive`)
 * - collection counts, content/interactive limits, timing, and timestamp (`metadata`)
 *
 * The model is independent of any specific AI, LLM, embedding, or vector
 * storage implementation and can be reused to generate different semantic
 * representations.
 */
export interface PageTrail {
    basics: PageBasics;
    container: ContainerTreeNode[];
    content: ContentElement[];
    interactive: InteractiveElement[];
    metadata: CollectionMetadata;
}
