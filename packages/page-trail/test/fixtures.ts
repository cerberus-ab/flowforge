import type { BoundingBox, ContainerElement, ContentElement, InteractiveElement } from '../src';

export const boundingBoxFixture: BoundingBox = {
    top: 0,
    left: 0,
    width: 100,
    height: 20,
    right: 100,
    bottom: 20,
};

export const containerBoundingBoxFixture: BoundingBox = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
};

export const domRectFixture: DOMRect = {
    ...boundingBoxFixture,
    x: boundingBoxFixture.left,
    y: boundingBoxFixture.top,
    toJSON: () => {},
} as DOMRect;

export function createContentElementFixture(overrides: Partial<ContentElement> = {}): ContentElement {
    return {
        kind: 'content',
        type: 'text',
        tag: 'p',
        id: 0,
        locator: { dataId: 'content-1', cssSelector: '#content-1' },
        bbox: boundingBoxFixture,
        meaningScore: { value: 0 },
        context: { path: [], breadcrumbs: [], contextScore: { value: 0 } },
        text: 'Welcome',
        importanceScore: { value: 0 },
        ...overrides,
    };
}

export function createInteractiveElementFixture(overrides: Partial<InteractiveElement> = {}): InteractiveElement {
    return {
        kind: 'interactive',
        type: 'button',
        role: 'button',
        tag: 'button',
        id: 0,
        locator: { dataId: 'button-1', cssSelector: '#button-1' },
        bbox: { ...boundingBoxFixture, height: 40, bottom: 40 },
        meaningScore: { value: 0 },
        context: { path: [], breadcrumbs: [], contextScore: { value: 0 } },
        text: 'Save',
        labels: [],
        state: {},
        link: undefined,
        inViewport: false,
        aboveTheFold: false,
        importanceScore: { value: 0 },
        ...overrides,
    };
}

export function createContainerElementFixture(overrides: Partial<ContainerElement> = {}): ContainerElement {
    const role = overrides.role ?? 'section';
    const type = overrides.type ?? 'section';
    const labels = overrides.labels ?? [];
    const bbox = overrides.bbox ?? containerBoundingBoxFixture;

    return {
        kind: 'container',
        type,
        role,
        tag: overrides.tag ?? 'section',
        id: 0,
        locator: { dataId: 'container-1', cssSelector: undefined },
        bbox,
        labels,
        meaningScore: { value: 0 },
        ...overrides,
    };
}

export interface ContainerNodeFixture {
    data: ContainerElement;
    nodes: ContainerNodeFixture[];
}

export function createContainerNodeFixture(
    data: ContainerElement,
    nodes: ContainerNodeFixture[] = [],
): ContainerNodeFixture {
    return {
        data,
        nodes,
    };
}
