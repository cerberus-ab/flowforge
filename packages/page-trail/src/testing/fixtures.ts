import { PageTrail } from '../PageTrail.ts';
import type {
    CollectionMetadata,
    ContainerRootNode,
    ContainerRootNodeDto,
    ElementsMetadata,
    PageBasics,
    PageElement,
    PageElementDto,
    PageMetadata,
    PageTrailDto,
    SnapshotMetadata,
    Viewport,
} from '../types/index.ts';
import { VERSION } from '../version.ts';

export type PageBasicsFixtureOverrides = Partial<Omit<PageBasics, 'viewport'>> & {
    viewport?: Partial<Viewport>;
};

export type CollectionMetadataFixtureOverrides = Partial<
    Omit<CollectionMetadata, 'page' | 'elements' | 'performance' | 'snapshot'>
> & {
    page?: Partial<PageMetadata>;
    elements?: Partial<ElementsMetadata>;
    performance?: Partial<CollectionMetadata['performance']>;
    snapshot?: Partial<SnapshotMetadata>;
};

export interface PageTrailDtoFixtureOverrides {
    contextOnly?: boolean;
    basics?: PageBasicsFixtureOverrides;
    structure?: Partial<ContainerRootNodeDto>;
    elements?: PageElementDto[];
    metadata?: CollectionMetadataFixtureOverrides;
}

export interface PageTrailFixtureOptions {
    contextOnly?: boolean;
    basics?: PageBasicsFixtureOverrides;
    structure?: ContainerRootNode;
    elements?: PageElement[];
    metadata?: CollectionMetadataFixtureOverrides;
}

export function createPageBasicsFixture(overrides: PageBasicsFixtureOverrides = {}): PageBasics {
    return {
        url: 'https://example.com/sandbox',
        title: 'FlowForge Sandbox',
        description: 'Extension sandbox for FlowForge.',
        language: 'en',
        ...overrides,
        viewport: {
            width: 1280,
            height: 720,
            scrollY: 0,
            scrollHeight: 1440,
            ...overrides.viewport,
        },
    };
}

export function createCollectionMetadataFixture(
    overrides: CollectionMetadataFixtureOverrides = {},
    snapshotUrl = 'https://example.com/sandbox',
): CollectionMetadata {
    return {
        ...overrides,
        page: {
            innerTextLength: 0,
            outerHtmlLength: 0,
            ...overrides.page,
        },
        elements: {
            containerElements: 0,
            containerElementsMatched: 0,
            containerElementsMaxDepth: 0,
            contentElements: 0,
            contentElementsMatched: 0,
            contentElementsCandidates: 0,
            contentElementsLimitReached: false,
            interactiveElements: 0,
            interactiveElementsMatched: 0,
            interactiveElementsCandidates: 0,
            interactiveElementsLimitReached: false,
            ...overrides.elements,
        },
        snapshot: {
            version: VERSION,
            collectedAt: 0,
            url: snapshotUrl,
            trailFingerprint: { dataIdSignature: undefined },
            ...overrides.snapshot,
        },
        performance: {
            basicsMs: 0,
            structureMs: 0,
            contentMs: 0,
            interactiveMs: 0,
            completeMs: 0,
            totalMs: 0,
            ...overrides.performance,
        },
    };
}

export function createPageTrailDtoFixture(overrides: PageTrailDtoFixtureOverrides = {}): PageTrailDto {
    const basics = createPageBasicsFixture(overrides.basics);

    return {
        contextOnly: overrides.contextOnly ?? false,
        basics,
        structure: {
            contentIds: [],
            interactiveIds: [],
            nodes: [],
            ...overrides.structure,
        },
        elements: overrides.elements ?? [],
        metadata: createCollectionMetadataFixture(overrides.metadata, basics.url),
    };
}

export function createPageTrailFixture(options: PageTrailFixtureOptions = {}): PageTrail {
    const basics = createPageBasicsFixture(options.basics);

    return new PageTrail(
        options.contextOnly ?? false,
        basics,
        options.structure ?? { content: [], interactive: [], nodes: [] },
        options.elements ?? [],
        createCollectionMetadataFixture(options.metadata, basics.url),
    );
}
