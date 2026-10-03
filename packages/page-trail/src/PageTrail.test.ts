import { describe, expect, it } from 'vitest';

import {
    createContainerElementFixture,
    createContentElementFixture,
    createInteractiveElementFixture,
} from '../test/fixtures';
import { PageTrail } from './PageTrail';
import { createPageTrailDtoFixture, createPageTrailFixture } from './testing';

describe('PageTrail DTO conversion', () => {
    it('replaces runtime container references with IDs', () => {
        // Given
        const container = createContainerElementFixture({ id: 1 });
        const content = createContentElementFixture({
            id: 2,
            context: {
                path: [{ container, distance: 0, relevanceScore: { value: 0.8 } }],
                breadcrumbs: [0],
                contextScore: { value: 0.8 },
            },
        });
        const interactive = createInteractiveElementFixture({ id: 3 });
        const pageTrail = createPageTrailFixture({
            metadata: { innerTextLength: 120, outerHtmlLength: 450 },
            structure: {
                content: [],
                interactive: [],
                nodes: [{ container, content: [content], interactive: [interactive], nodes: [] }],
            },
            elements: [container, content, interactive],
        });

        // When
        const dto = pageTrail.toDto();

        // Then
        expect(dto.contextOnly).toBe(false);
        expect(dto.structure).toEqual({
            contentIds: [],
            interactiveIds: [],
            nodes: [{ containerId: 1, contentIds: [2], interactiveIds: [3], nodes: [] }],
        });
        expect(dto.elements[1]).toMatchObject({
            id: 2,
            context: {
                path: [{ containerId: 1, distance: 0, relevanceScore: { value: 0.8 } }],
            },
        });
        expect(dto.elements[1]).not.toHaveProperty('context.path.0.container');
        expect(dto.metadata).toMatchObject({ innerTextLength: 120, outerHtmlLength: 450 });
    });

    it('restores shared container references after a JSON roundtrip', () => {
        // Given
        const container = createContainerElementFixture({ id: 1 });
        const content = createContentElementFixture({
            id: 2,
            context: {
                path: [{ container, distance: 0, relevanceScore: { value: 0.8 } }],
                breadcrumbs: [0],
                contextScore: { value: 0.8 },
            },
        });
        const interactive = createInteractiveElementFixture({ id: 3 });
        const dto = createPageTrailFixture({
            structure: {
                content: [content],
                interactive: [],
                nodes: [{ container, content: [], interactive: [interactive], nodes: [] }],
            },
            elements: [container, content, interactive],
        }).toDto();

        // When
        const serializedDto = JSON.parse(JSON.stringify(dto)) as ReturnType<PageTrail['toDto']>;
        const restored = PageTrail.fromDto(serializedDto);

        // Then
        const structureContainer = restored.mapStructureTree((node) =>
            'container' in node ? node.container : undefined,
        )[1];
        const contextContainer = restored.getContent()[0]!.context.path[0]!.container;
        expect(contextContainer).toBe(structureContainer);
        expect(restored.getStructure().content[0]).toBe(restored.getContent()[0]);
        expect(restored.getStructure().nodes[0]!.interactive[0]).toBe(restored.getInteractive()[0]);
        expect(restored.toDto()).toEqual(serializedDto);
    });

    it('preserves context-only mode after a JSON roundtrip', () => {
        // Given
        const dto = createPageTrailFixture({
            contextOnly: true,
            elements: [createContentElementFixture({ locator: undefined })],
        }).toDto();

        // When
        const serializedDto = JSON.parse(JSON.stringify(dto)) as ReturnType<PageTrail['toDto']>;
        const restored = PageTrail.fromDto(serializedDto);

        // Then
        expect(restored.contextOnly).toBe(true);
        expect(restored.getContent()[0]?.locator).toBeUndefined();
    });

    it('preserves page size metadata after a JSON roundtrip', () => {
        // Given
        const dto = createPageTrailFixture({
            metadata: { innerTextLength: 120, outerHtmlLength: 450 },
        }).toDto();
        const serializedDto = JSON.parse(JSON.stringify(dto)) as ReturnType<PageTrail['toDto']>;

        // When
        const restored = PageTrail.fromDto(serializedDto);

        // Then
        expect(restored.metadata.innerTextLength).toBe(120);
        expect(restored.metadata.outerHtmlLength).toBe(450);
        expect(restored.toDto().metadata).toEqual(serializedDto.metadata);
    });

    it('rejects a structure reference to an unknown container', () => {
        // Given
        const dto = createPageTrailDtoFixture({
            structure: {
                nodes: [{ containerId: 42, contentIds: [], interactiveIds: [], nodes: [] }],
            },
        });

        // When
        const restore = () => PageTrail.fromDto(dto);

        // Then
        expect(restore).toThrow('PageTrail DTO references unknown element ID: 42');
    });

    it('rejects a structure reference to unknown content', () => {
        // Given
        const container = createContainerElementFixture({ id: 1 });
        const dto = createPageTrailDtoFixture({
            structure: {
                nodes: [{ containerId: 1, contentIds: [42], interactiveIds: [], nodes: [] }],
            },
            elements: [container],
        });

        // When
        const restore = () => PageTrail.fromDto(dto);

        // Then
        expect(restore).toThrow('PageTrail DTO references unknown element ID: 42');
    });

    it('rejects a structure reference to unknown interactive element', () => {
        // Given
        const dto = createPageTrailDtoFixture({ structure: { interactiveIds: [42] } });

        // When
        const restore = () => PageTrail.fromDto(dto);

        // Then
        expect(restore).toThrow('PageTrail DTO references unknown element ID: 42');
    });

    it('rejects a context reference to an unknown container', () => {
        // Given
        const unknownContainer = createContainerElementFixture({ id: 42 });
        const dto = createPageTrailFixture({
            elements: [
                createContentElementFixture({
                    context: {
                        path: [{ container: unknownContainer, distance: 0, relevanceScore: { value: 0.8 } }],
                        breadcrumbs: [0],
                        contextScore: { value: 0.8 },
                    },
                }),
            ],
        }).toDto();

        // When
        const restore = () => PageTrail.fromDto(dto);

        // Then
        expect(restore).toThrow('PageTrail DTO references unknown element ID: 42');
    });
});

describe('PageTrail elements', () => {
    it('returns new content and interactive arrays on every call', () => {
        // Given
        const content = createContentElementFixture({ id: 1 });
        const interactive = createInteractiveElementFixture({ id: 2 });
        const pageTrail = createPageTrailFixture({ elements: [content, interactive] });

        // When
        const firstContent = pageTrail.getContent();
        const firstInteractive = pageTrail.getInteractive();
        firstContent.length = 0;
        firstInteractive.length = 0;

        // Then
        expect(pageTrail.getContent()).toEqual([content]);
        expect(pageTrail.getInteractive()).toEqual([interactive]);
    });

    it('returns content elements sorted by descending importance without changing their collected order', () => {
        // Given
        const low = createContentElementFixture({ id: 1, importanceScore: { value: 0.2 } });
        const container = createContainerElementFixture({ id: 2 });
        const interactive = createInteractiveElementFixture({ id: 3, importanceScore: { value: 0.9 } });
        const medium = createContentElementFixture({ id: 4, importanceScore: { value: 0.5 } });
        const elements = [low, container, interactive, medium];
        const pageTrail = createPageTrailFixture({ elements });

        // When
        const sorted = pageTrail.getContentByImportanceDesc();

        // Then
        expect(sorted).toEqual([medium, low]);
        expect(pageTrail.getContent()).toEqual([low, medium]);
    });

    it('returns interactive elements sorted by descending importance without changing their collected order', () => {
        // Given
        const low = createInteractiveElementFixture({ id: 1, importanceScore: { value: 0.2 } });
        const content = createContentElementFixture({ id: 2, importanceScore: { value: 1 } });
        const high = createInteractiveElementFixture({ id: 3, importanceScore: { value: 0.9 } });
        const elements = [low, content, high];
        const pageTrail = createPageTrailFixture({ elements });

        // When
        const sorted = pageTrail.getInteractiveByImportanceDesc();

        // Then
        expect(sorted).toEqual([high, low]);
        expect(pageTrail.getInteractive()).toEqual([low, high]);
    });

    it('returns a new structure without changing element references', () => {
        // Given
        const content = createContentElementFixture({ id: 1 });
        const interactive = createInteractiveElementFixture({ id: 2 });
        const container = createContainerElementFixture({ id: 3 });
        const pageTrail = createPageTrailFixture({
            structure: {
                content: [content],
                interactive: [],
                nodes: [{ container, content: [], interactive: [interactive], nodes: [] }],
            },
        });

        // When
        const first = pageTrail.getStructure();
        first.content.length = 0;
        first.nodes[0]!.interactive.length = 0;
        first.nodes.length = 0;
        const second = pageTrail.getStructure();

        // Then
        expect(second.content).toEqual([content]);
        expect(second.content[0]).toBe(content);
        expect(second.nodes[0]!.interactive).toEqual([interactive]);
        expect(second.nodes[0]!.interactive[0]).toBe(interactive);
    });

    it('returns a new structure with elements sorted by descending importance at every level', () => {
        // Given
        const rootContentLow = createContentElementFixture({ id: 1, importanceScore: { value: 0.2 } });
        const rootContentHigh = createContentElementFixture({ id: 2, importanceScore: { value: 0.8 } });
        const rootInteractiveLow = createInteractiveElementFixture({ id: 3, importanceScore: { value: 0.1 } });
        const rootInteractiveHigh = createInteractiveElementFixture({ id: 4, importanceScore: { value: 0.9 } });
        const nestedContentLow = createContentElementFixture({ id: 5, importanceScore: { value: 0.3 } });
        const nestedContentHigh = createContentElementFixture({ id: 6, importanceScore: { value: 0.7 } });
        const nestedInteractiveLow = createInteractiveElementFixture({ id: 7, importanceScore: { value: 0.4 } });
        const nestedInteractiveHigh = createInteractiveElementFixture({ id: 8, importanceScore: { value: 0.6 } });
        const container = createContainerElementFixture({ id: 9 });
        const structure = {
            content: [rootContentLow, rootContentHigh],
            interactive: [rootInteractiveLow, rootInteractiveHigh],
            nodes: [
                {
                    container,
                    content: [nestedContentLow, nestedContentHigh],
                    interactive: [nestedInteractiveLow, nestedInteractiveHigh],
                    nodes: [],
                },
            ],
        };
        const pageTrail = createPageTrailFixture({ structure });
        const original = pageTrail.getStructure();

        // When
        const sorted = pageTrail.getStructureByImportanceDesc();

        // Then
        expect(sorted.content).toEqual([rootContentHigh, rootContentLow]);
        expect(sorted.interactive).toEqual([rootInteractiveHigh, rootInteractiveLow]);
        expect(sorted.nodes[0]!.content).toEqual([nestedContentHigh, nestedContentLow]);
        expect(sorted.nodes[0]!.interactive).toEqual([nestedInteractiveHigh, nestedInteractiveLow]);
        expect(pageTrail.getStructure()).toEqual(original);
        expect(pageTrail.getStructure().content).toEqual([rootContentLow, rootContentHigh]);
        expect(pageTrail.getStructure().nodes[0]!.content).toEqual([nestedContentLow, nestedContentHigh]);
    });
});

describe('PageTrail structure traversal', () => {
    it('maps the root and container nodes in depth-first order', () => {
        // Given
        const first = createContainerElementFixture({ id: 1 });
        const nested = createContainerElementFixture({ id: 2 });
        const second = createContainerElementFixture({ id: 3 });
        const pageTrail = createPageTrailFixture({
            structure: {
                content: [],
                interactive: [],
                nodes: [
                    {
                        container: first,
                        content: [],
                        interactive: [],
                        nodes: [{ container: nested, content: [], interactive: [], nodes: [] }],
                    },
                    { container: second, content: [], interactive: [], nodes: [] },
                ],
            },
        });

        // When
        const mapped = pageTrail.mapStructureTree((node, depth) => ({
            id: 'container' in node ? node.container.id : 'root',
            depth,
        }));

        // Then
        expect(mapped).toEqual([
            { id: 'root', depth: 0 },
            { id: 1, depth: 1 },
            { id: 2, depth: 2 },
            { id: 3, depth: 1 },
        ]);
    });

    it('limits descendant depth and sibling branches while retaining the root', () => {
        // Given
        const pageTrail = createPageTrailFixture({
            structure: {
                content: [],
                interactive: [],
                nodes: [
                    {
                        container: createContainerElementFixture({ id: 1 }),
                        content: [],
                        interactive: [],
                        nodes: [
                            {
                                container: createContainerElementFixture({ id: 2 }),
                                content: [],
                                interactive: [],
                                nodes: [],
                            },
                        ],
                    },
                    {
                        container: createContainerElementFixture({ id: 3 }),
                        content: [],
                        interactive: [],
                        nodes: [],
                    },
                ],
            },
        });

        // When
        const mapped = pageTrail.mapStructureTree((node) => ('container' in node ? node.container.id : 'root'), 1, 1);

        // Then
        expect(mapped).toEqual(['root', 1]);
    });
});
