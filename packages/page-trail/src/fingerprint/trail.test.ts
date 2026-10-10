import { describe, expect, it } from 'vitest';

import { trailFingerprint } from './trail';

describe('trailFingerprint', () => {
    it('creates the same count-prefixed hash regardless of ID order', () => {
        // Given
        const dataIds = ['ff00000002', 'ff00000001'];

        // When
        const firstFingerprint = trailFingerprint({ dataIds });
        const reorderedFingerprint = trailFingerprint({ dataIds: [...dataIds].reverse() });

        // Then
        expect(firstFingerprint.dataIdSignature).toMatch(/^2-[\da-f]{16}$/);
        expect(reorderedFingerprint).toEqual(firstFingerprint);
    });

    it('counts each unique data ID once', () => {
        // Given
        const dataIds = ['ff00000001', 'ff00000001', 'ff00000002'];

        // When
        const fingerprint = trailFingerprint({ dataIds });

        // Then
        expect(fingerprint.dataIdSignature).toMatch(/^2-/);
        expect(fingerprint).toEqual(trailFingerprint({ dataIds: ['ff00000001', 'ff00000002'] }));
    });

    it('includes the number of data IDs in the fingerprint', () => {
        // Given
        const oneId = trailFingerprint({ dataIds: ['ff00000001'] });
        const twoIds = trailFingerprint({ dataIds: ['ff00000001', 'ff00000002'] });

        // Then
        expect(oneId.dataIdSignature).toMatch(/^1-/);
        expect(twoIds.dataIdSignature).toMatch(/^2-/);
    });

    it('returns an undefined hash when data IDs are unavailable', () => {
        // When
        const fingerprint = trailFingerprint({});

        // Then
        expect(fingerprint).toEqual({ dataIdSignature: undefined });
    });
});
