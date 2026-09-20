// Document Basics

export interface Scoring {
    value: number; // [0..1]
}

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

export type ContainerElementLabelSource =
    'aria-labelledby' | 'aria-label' | 'legend' | 'heading' | 'subheading' | 'title';

export interface ContainerElementLabel {
    value: string;
    source: ContainerElementLabelSource;
}

export interface ContainerTreeNode {
    container: ContainerElement;
    nodes: ContainerTreeNode[];
}

export interface ContainerPathNode {
    container: ContainerElement;
    distance: number;
    relevanceScore: Scoring;
}

export interface ElementContext {
    path: ContainerPathNode[];
    breadcrumbs: number[];
    contextScore: Scoring;
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

export type ElementId = number;
export type ElementDataId = string;

export interface ElementLocator {
    dataId: ElementDataId;
    cssSelector: string | undefined; // fallback
}

export type ElementKind = 'container' | 'content' | 'interactive';

export type ContainerElementType = 'dialog' | 'landmark' | 'navigation' | 'form' | 'section' | 'widget' | 'table';
export type ContentElementType = 'text' | 'heading';
export type InteractiveElementType = 'button' | 'input' | 'select' | 'link';

export interface BaseElement {
    id: ElementId;
    locator: ElementLocator;
    tag: string;
    kind: ElementKind;
    type: ContainerElementType | ContentElementType | InteractiveElementType;
    bbox: BoundingBox;
    meaningScore: Scoring;
}

export interface ContainerElement extends BaseElement {
    kind: 'container';
    type: ContainerElementType;
    role: ContainerElementRole;
    labels: ContainerElementLabel[];
}

export interface TargetElement extends BaseElement {
    context: ElementContext;
    importanceScore: Scoring;
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

export type PageElement = ContainerElement | ContentElement | InteractiveElement;

export interface CollectionMetadata {
    // stats
    containerElements: number;
    containerElementsSelected: number;
    containerElementsMaxDepth: number;
    contentElements: number;
    contentElementsSelected: number;
    contentElementsCandidates: number;
    contentElementsLimitReached: boolean;
    interactiveElements: number;
    interactiveElementsSelected: number;
    interactiveElementsCandidates: number;
    interactiveElementsLimitReached: boolean;
    // timings
    collectedAt: number; // timestamp
    performance: {
        basicsMs: number;
        structureMs: number;
        contentMs: number;
        interactiveMs: number;
        totalMs: number;
    };
}
