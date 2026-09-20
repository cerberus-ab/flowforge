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
        const pageTrail = pageTrailFixture({
            structure: [{ container, nodes: [] }],
            elements: [container, content],
        });

        // When
        const dto = pageTrail.toDto();

        // Then
        expect(dto.contextOnly).toBe(false);
        expect(dto.structure).toEqual([{ containerId: 1, nodes: [] }]);
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
        const dto = pageTrailFixture({
            structure: [{ container: containerElement({ id: 1 }), nodes: [] }],
            elements: [
                containerElement({ id: 1 }),
                contentElement({
                    id: 2,
                    context: {
                        path: [
                            {
                                container: containerElement({ id: 1 }),
                                distance: 0,
                                relevanceScore: { value: 0.8 },
                            },
                        ],
                        breadcrumbs: [0],
                        contextScore: { value: 0.8 },
                    },
                }),
            ],
        }).toDto();

        // When
        const serializedDto = JSON.parse(JSON.stringify(dto)) as ReturnType<PageTrail['toDto']>;
        const restored = PageTrail.fromDto(serializedDto);

        // Then
        const structureContainer = restored.mapStructure((node) => node.container)[0];
        const contextContainer = restored.content()[0]!.context.path[0]!.container;
        expect(contextContainer).toBe(structureContainer);
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
        expect(restored.content()[0]?.locator).toBeUndefined();
    });

    it('rejects a structure reference to an unknown container', () => {
        // Given
        const dto = pageTrailFixture().toDto();
        dto.structure = [{ containerId: 42, nodes: [] }];

        // When
        const restore = () => PageTrail.fromDto(dto);

        // Then
        expect(restore).toThrow('PageTrail DTO references unknown container ID: 42');
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
        expect(restore).toThrow('PageTrail DTO references unknown container ID: 42');
    });
});

describe('PageTrail elements', () => {
    it('returns new content and interactive arrays on every call', () => {
        // Given
        const content = contentElement({ id: 1 });
        const interactive = interactiveElement({ id: 2 });
        const pageTrail = pageTrailFixture({ elements: [content, interactive] });

        // When
        const firstContent = pageTrail.content();
        const firstInteractive = pageTrail.interactive();
        firstContent.length = 0;
        firstInteractive.length = 0;

        // Then
        expect(pageTrail.content()).toEqual([content]);
        expect(pageTrail.interactive()).toEqual([interactive]);
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
        const sorted = pageTrail.contentByImportanceDesc();

        // Then
        expect(sorted).toEqual([medium, low]);
        expect(pageTrail.elements).toEqual(elements);
    });

    it('returns interactive elements sorted by descending importance without changing their collected order', () => {
        // Given
        const low = interactiveElement({ id: 1, importanceScore: { value: 0.2 } });
        const content = contentElement({ id: 2, importanceScore: { value: 1 } });
        const high = interactiveElement({ id: 3, importanceScore: { value: 0.9 } });
        const elements = [low, content, high];
        const pageTrail = pageTrailFixture({ elements });

        // When
        const sorted = pageTrail.interactiveByImportanceDesc();

        // Then
        expect(sorted).toEqual([high, low]);
        expect(pageTrail.elements).toEqual(elements);
    });
});
