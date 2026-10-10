import { describe, expect, it } from 'vitest';

import { fnv1a64 } from './hash';

describe('fnv1a64', () => {
    it('returns the standard 64-bit FNV-1a hash for an ASCII string', () => {
        // Given
        const value = 'a';

        // When
        const hash = fnv1a64(value);

        // Then
        expect(hash).toBe('af63dc4c8601ec8c');
    });

    it('returns the offset basis for an empty string', () => {
        // When
        const hash = fnv1a64('');

        // Then
        expect(hash).toBe('cbf29ce484222325');
    });
});
