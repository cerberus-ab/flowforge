import type { BoundingBox, ContainerElement, ContentElement, InteractiveElement } from '../src';

export const testBoundingBox: BoundingBox = {
    top: 0,
    left: 0,
    width: 100,
    height: 20,
    right: 100,
    bottom: 20,
};

export const testContainerBoundingBox: BoundingBox = {
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
};

export const testDomRect: DOMRect = {
    ...testBoundingBox,
    x: testBoundingBox.left,
    y: testBoundingBox.top,
    toJSON: () => {},
} as DOMRect;

export function contentElement(overrides: Partial<ContentElement> = {}): ContentElement {
    return {
        kind: 'content',
        type: 'text',
        tag: 'p',
        dataId: 'content-1',
        cssSelector: '#content-1',
        bbox: testBoundingBox,
        meaningScore: { value: 0 },
        context: { path: [], contextScore: { value: 0 } },
        contextDeprecated: { path: [] },
        text: 'Welcome',
        importanceScore: 0,
        ...overrides,
    };
}

export function interactiveElement(overrides: Partial<InteractiveElement> = {}): InteractiveElement {
    return {
        kind: 'interactive',
        type: 'button',
        role: 'button',
        tag: 'button',
        dataId: 'button-1',
        cssSelector: '#button-1',
        bbox: { ...testBoundingBox, height: 40, bottom: 40 },
        meaningScore: { value: 0 },
        context: { path: [], contextScore: { value: 0 } },
        contextDeprecated: { path: [] },
        text: 'Save',
        labels: [],
        state: {},
        link: undefined,
        inViewport: false,
        aboveTheFold: false,
        importanceScore: 0,
        ...overrides,
    };
}

export function containerElement(overrides: Partial<ContainerElement> = {}): ContainerElement {
    const role = overrides.role ?? 'section';
    const type = overrides.type ?? 'section';
    const labels = overrides.labels ?? [];
    const bbox = overrides.bbox ?? testContainerBoundingBox;

    return {
        kind: 'container',
        type,
        role,
        tag: overrides.tag ?? 'section',
        dataId: 'container-1',
        cssSelector: undefined,
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

export function containerNode(data: ContainerElement, nodes: ContainerNodeFixture[] = []): ContainerNodeFixture {
    return {
        data,
        nodes,
    };
}
