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

// Element Descriptors

export interface BoundingBox {
    top: number;
    left: number;
    width: number;
    height: number;
    right: number;
    bottom: number;
}

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
    | 'tab panel'
    | 'toolbar'
    | 'table'
    | 'table row'
    | 'menu';

export interface ElementContext {
    path: ContainerElementRole[];
    sectionName?: string;
}

export type ElementLabelSource =
    | 'aria-labelledby'
    | 'aria-label'
    | 'label-for'
    | 'label-wrapper'
    | 'value'
    | 'placeholder'
    | 'alt'
    | 'title'
    | 'name';

export interface ElementLabel {
    value: string;
    source: ElementLabelSource;
}

export type InteractiveElementRole =
    | 'button'
    | 'link'
    | 'checkbox'
    | 'radio'
    | 'slider'
    | 'textbox'
    | 'searchbox'
    | 'combobox'
    | 'listbox'
    | 'dialog';

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

export type ContentElementType = 'text' | 'heading';
export type InteractiveElementType = 'button' | 'input' | 'select' | 'link';

export interface ElementLocator {
    tag: string;
    dataId: string;
    selector: string;
    bbox: BoundingBox;
}

export interface BaseElement extends ElementLocator {
    type: ContentElementType | InteractiveElementType;
    context: ElementContext;
    importanceScore: number; // [0..1]
}

export interface ContentElement extends BaseElement {
    type: ContentElementType;
    text: string;
}

export interface InteractiveElement extends BaseElement {
    type: InteractiveElementType;
    role: InteractiveElementRole;
    text?: string;
    labels: ElementLabel[];
    state: InteractiveElementState;
    link?: InteractiveLink; // for links only
}

export interface PageData {
    basics: PageBasics;
    content: ContentElement[];
    interactive: InteractiveElement[];
    timestamp: number;
}
