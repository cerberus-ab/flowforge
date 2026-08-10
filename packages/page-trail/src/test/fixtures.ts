import type { BoundingBox, ContentElement, InteractiveElement } from '../types';

export const testBoundingBox: BoundingBox = {
    top: 0,
    left: 0,
    width: 100,
    height: 20,
    right: 100,
    bottom: 20,
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
        selector: '#content-1',
        bbox: testBoundingBox,
        context: { path: [] },
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
        selector: '#button-1',
        bbox: { ...testBoundingBox, height: 40, bottom: 40 },
        context: { path: [] },
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
