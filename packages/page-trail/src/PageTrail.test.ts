import { describe, expect, it } from 'vitest';

import { containerElement, contentElement, pageTrailFixture } from '../test/fixtures';
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
        expect(dto.structure).toEqual([{ containerId: 1, nodes: [] }]);
        expect(dto.elements[1]).toMatchObject({
            id: 2,
            context: {
                path: [{ containerId: 1, distance: 0, relevanceScore: { value: 0.8 } }],
            },
        });
        expect(dto.elements[1]).not.toHaveProperty('context.path.0.container');
    });

    it('restores shared container references from a DTO', () => {
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
        const restored = PageTrail.fromDto(dto);

        // Then
        const structureContainer = restored.mapStructure((node) => node.container)[0];
        const contextContainer = restored.content[0]!.context.path[0]!.container;
        expect(contextContainer).toBe(structureContainer);
        expect(restored.toDto()).toEqual(dto);
    });
});
