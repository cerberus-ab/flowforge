import { PageTrail } from '../src';
import type {
    BoundingBox,
    CollectionMetadata,
    ContainerElement,
    ContainerRootNode,
    ContentElement,
    InteractiveElement,
    PageBasics,
    PageElement,
} from '../src';

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
        id: 0,
        locator: { dataId: 'content-1', cssSelector: '#content-1' },
        bbox: testBoundingBox,
        meaningScore: { value: 0 },
        context: { path: [], breadcrumbs: [], contextScore: { value: 0 } },
        text: 'Welcome',
        importanceScore: { value: 0 },
        ...overrides,
    };
}

export function interactiveElement(overrides: Partial<InteractiveElement> = {}): InteractiveElement {
    return {
        kind: 'interactive',
        type: 'button',
        role: 'button',
        tag: 'button',
        id: 0,
        locator: { dataId: 'button-1', cssSelector: '#button-1' },
        bbox: { ...testBoundingBox, height: 40, bottom: 40 },
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

export function containerNode(data: ContainerElement, nodes: ContainerNodeFixture[] = []): ContainerNodeFixture {
    return {
        data,
        nodes,
    };
}

interface PageTrailFixtureOptions {
    contextOnly?: boolean;
    basics?: PageBasics;
    structure?: ContainerRootNode;
    elements?: PageElement[];
    metadata?: CollectionMetadata;
}

export function pageTrailFixture(overrides: PageTrailFixtureOptions = {}): PageTrail {
    return new PageTrail(
        overrides.contextOnly ?? false,
        overrides.basics ?? {
            url: 'https://example.com/sandbox',
            title: 'FlowForge Sandbox',
            description: 'Extension sandbox for FlowForge.',
            language: 'en',
            viewport: {
                width: 1280,
                height: 720,
                scrollY: 0,
                scrollHeight: 1440,
            },
        },
        overrides.structure ?? { content: [], interactive: [], nodes: [] },
        overrides.elements ?? [],
        overrides.metadata ?? {
            version: '0.1.0',
            containerElements: 0,
            containerElementsSelected: 0,
            containerElementsMaxDepth: 0,
            contentElements: 0,
            contentElementsSelected: 0,
            contentElementsCandidates: 0,
            contentElementsLimitReached: false,
            interactiveElements: 0,
            interactiveElementsSelected: 0,
            interactiveElementsCandidates: 0,
            interactiveElementsLimitReached: false,
            collectedAt: 0,
            performance: {
                basicsMs: 0,
                structureMs: 0,
                contentMs: 0,
                interactiveMs: 0,
                completeMs: 0,
                totalMs: 0,
            },
        },
    );
}
