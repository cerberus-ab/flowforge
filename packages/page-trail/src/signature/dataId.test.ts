import { describe, expect, it } from 'vitest';

import { createDataIdSignature } from './dataId';

describe('createDataIdSignature', () => {
    it('creates the same count-prefixed hash regardless of ID order', () => {
        // Given
        const dataIds = ['ff00000002', 'ff00000001'];

        // When
        const firstSignature = createDataIdSignature(dataIds);
        const reorderedSignature = createDataIdSignature([...dataIds].reverse());

        // Then
        expect(firstSignature).toMatch(/^2-[\da-f]{16}$/);
        expect(reorderedSignature).toBe(firstSignature);
    });

    it('counts each unique data ID once', () => {
        // Given
        const dataIds = ['ff00000001', 'ff00000001', 'ff00000002'];

        // Then
        expect(createDataIdSignature(dataIds)).toMatch(/^2-/);
        expect(createDataIdSignature(dataIds)).toBe(createDataIdSignature(['ff00000001', 'ff00000002']));
    });

    it('includes the number of data IDs in the signature', () => {
        // When
        const oneId = createDataIdSignature(['ff00000001']);
        const twoIds = createDataIdSignature(['ff00000001', 'ff00000002']);

        // Then
        expect(oneId).toMatch(/^1-/);
        expect(twoIds).toMatch(/^2-/);
    });

    it('creates a signature for an empty set of data IDs', () => {
        expect(createDataIdSignature([])).toMatch(/^0-[\da-f]{16}$/);
    });
});
