import { describe, expect, it } from 'vitest';

import { containerElement, contentElement, interactiveElement, pageTrailFixture } from '../test/fixtures';
import { PageTrail } from './PageTrail';

describe('PageTrail DTO conversion', () => {
    it('replaces runtime container references with IDs', () => {
        // Given
        const container = containerElement({ id: 1 });
        const content = contentElement({
            id: 2,
            context: {
                path: [{ container, distance: 0, relevanceScore: { value: 0.8 } }],
                breadcrumbs: [0],
                contextScore: { value: 0.8 },
            },
        });
        const interactive = interactiveElement({ id: 3 });
        const pageTrail = pageTrailFixture({
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
    });

    it('restores shared container references after a JSON roundtrip', () => {
        // Given
        const container = containerElement({ id: 1 });
        const content = contentElement({
            id: 2,
            context: {
                path: [{ container, distance: 0, relevanceScore: { value: 0.8 } }],
                breadcrumbs: [0],
                contextScore: { value: 0.8 },
            },
        });
        const interactive = interactiveElement({ id: 3 });
        const dto = pageTrailFixture({
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
        const structureContainer = restored.mapStructureContainers((node) => node.container)[0];
        const contextContainer = restored.getContent()[0]!.context.path[0]!.container;
        expect(contextContainer).toBe(structureContainer);
        expect(restored.getStructure().content[0]).toBe(restored.getContent()[0]);
        expect(restored.getStructure().nodes[0]!.interactive[0]).toBe(restored.getInteractive()[0]);
        expect(restored.toDto()).toEqual(serializedDto);
    });

    it('preserves context-only mode after a JSON roundtrip', () => {
        // Given
        const dto = pageTrailFixture({
            contextOnly: true,
            elements: [contentElement({ locator: undefined })],
        }).toDto();

        // When
        const serializedDto = JSON.parse(JSON.stringify(dto)) as ReturnType<PageTrail['toDto']>;
        const restored = PageTrail.fromDto(serializedDto);

        // Then
        expect(restored.contextOnly).toBe(true);
        expect(restored.getContent()[0]?.locator).toBeUndefined();
    });

    it('rejects a structure reference to an unknown container', () => {
        // Given
        const dto = pageTrailFixture().toDto();
        dto.structure = {
            contentIds: [],
            interactiveIds: [],
            nodes: [{ containerId: 42, contentIds: [], interactiveIds: [], nodes: [] }],
        };

        // When
        const restore = () => PageTrail.fromDto(dto);

        // Then
        expect(restore).toThrow('PageTrail DTO references unknown element ID: 42');
    });

    it('rejects a structure reference to unknown content', () => {
        // Given
        const container = containerElement({ id: 1 });
        const dto = pageTrailFixture({
            structure: {
                content: [],
                interactive: [],
                nodes: [{ container, content: [], interactive: [], nodes: [] }],
            },
            elements: [container],
        }).toDto();
        dto.structure.nodes[0]!.contentIds = [42];

        // When
        const restore = () => PageTrail.fromDto(dto);

        // Then
        expect(restore).toThrow('PageTrail DTO references unknown element ID: 42');
    });

    it('rejects a structure reference to unknown interactive element', () => {
        // Given
        const dto = pageTrailFixture().toDto();
        dto.structure.interactiveIds = [42];

        // When
        const restore = () => PageTrail.fromDto(dto);

        // Then
        expect(restore).toThrow('PageTrail DTO references unknown element ID: 42');
    });

    it('rejects a context reference to an unknown container', () => {
        // Given
        const unknownContainer = containerElement({ id: 42 });
        const dto = pageTrailFixture({
            elements: [
                contentElement({
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
        const content = contentElement({ id: 1 });
        const interactive = interactiveElement({ id: 2 });
        const pageTrail = pageTrailFixture({ elements: [content, interactive] });

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
        const low = contentElement({ id: 1, importanceScore: { value: 0.2 } });
        const container = containerElement({ id: 2 });
        const interactive = interactiveElement({ id: 3, importanceScore: { value: 0.9 } });
        const medium = contentElement({ id: 4, importanceScore: { value: 0.5 } });
        const elements = [low, container, interactive, medium];
        const pageTrail = pageTrailFixture({ elements });

        // When
        const sorted = pageTrail.getContentByImportanceDesc();

        // Then
        expect(sorted).toEqual([medium, low]);
        expect(pageTrail.getContent()).toEqual([low, medium]);
    });

    it('returns interactive elements sorted by descending importance without changing their collected order', () => {
        // Given
        const low = interactiveElement({ id: 1, importanceScore: { value: 0.2 } });
        const content = contentElement({ id: 2, importanceScore: { value: 1 } });
        const high = interactiveElement({ id: 3, importanceScore: { value: 0.9 } });
        const elements = [low, content, high];
        const pageTrail = pageTrailFixture({ elements });

        // When
        const sorted = pageTrail.getInteractiveByImportanceDesc();

        // Then
        expect(sorted).toEqual([high, low]);
        expect(pageTrail.getInteractive()).toEqual([low, high]);
    });

    it('returns a new structure without changing element references', () => {
        // Given
        const content = contentElement({ id: 1 });
        const interactive = interactiveElement({ id: 2 });
        const container = containerElement({ id: 3 });
        const pageTrail = pageTrailFixture({
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
        const rootContentLow = contentElement({ id: 1, importanceScore: { value: 0.2 } });
        const rootContentHigh = contentElement({ id: 2, importanceScore: { value: 0.8 } });
        const rootInteractiveLow = interactiveElement({ id: 3, importanceScore: { value: 0.1 } });
        const rootInteractiveHigh = interactiveElement({ id: 4, importanceScore: { value: 0.9 } });
        const nestedContentLow = contentElement({ id: 5, importanceScore: { value: 0.3 } });
        const nestedContentHigh = contentElement({ id: 6, importanceScore: { value: 0.7 } });
        const nestedInteractiveLow = interactiveElement({ id: 7, importanceScore: { value: 0.4 } });
        const nestedInteractiveHigh = interactiveElement({ id: 8, importanceScore: { value: 0.6 } });
        const container = containerElement({ id: 9 });
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
        const pageTrail = pageTrailFixture({ structure });
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
