import { describe, expect, it } from 'vitest';

import { createContentElementFixture } from '../../test/fixtures';
import { PageTrail } from '../PageTrail';
import { VERSION } from '../version';
import { createCollectionMetadataFixture, createPageTrailDtoFixture, createPageTrailFixture } from './fixtures';

describe('PageTrail test fixtures', () => {
    it('creates a complete DTO from nested partial overrides', () => {
        // When
        const dto = createPageTrailDtoFixture({
            basics: {
                title: 'Settings',
                viewport: { width: 1440 },
            },
            metadata: {
                contentElements: 2,
                performance: { totalMs: 10 },
            },
        });

        // Then
        expect(dto.basics.title).toBe('Settings');
        expect(dto.basics.viewport).toEqual({
            width: 1440,
            height: 720,
            scrollY: 0,
            scrollHeight: 1440,
        });
        expect(dto.metadata).toEqual(
            expect.objectContaining({
                version: VERSION,
                contentElements: 2,
                interactiveElements: 0,
                performance: expect.objectContaining({ basicsMs: 0, totalMs: 10 }),
            }),
        );
    });

    it('creates runtime PageTrail and metadata fixtures with package defaults', () => {
        // When
        const pageTrail = createPageTrailFixture();
        const metadata = createCollectionMetadataFixture();

        // Then
        expect(pageTrail).toBeInstanceOf(PageTrail);
        expect(pageTrail.toDto()).toEqual(createPageTrailDtoFixture());
        expect(metadata.version).toBe(VERSION);
        expect(metadata.performance.totalMs).toBe(0);
    });

    it('preserves supplied runtime element references', () => {
        // Given
        const content = createContentElementFixture();

        // When
        const pageTrail = createPageTrailFixture({
            structure: { content: [content], interactive: [], nodes: [] },
            elements: [content],
        });

        // Then
        expect(pageTrail.getContent()[0]).toBe(content);
        expect(pageTrail.getStructure().content[0]).toBe(content);
    });
});
