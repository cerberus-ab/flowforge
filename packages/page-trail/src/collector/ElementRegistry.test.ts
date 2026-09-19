import { describe, expect, it } from 'vitest';

import { ElementRegistry } from './ElementRegistry';

describe('ElementRegistry', () => {
    it('resolves registered elements by internal numeric ID', () => {
        const registry = new ElementRegistry();
        const element = document.createElement('section');

        const id = registry.register(element);

        expect(id).toBe(0);
        expect(registry.get(id)).toBe(element);
    });

    it('reuses ID zero when registering the same element again', () => {
        const registry = new ElementRegistry();
        const element = document.createElement('section');

        expect(registry.register(element)).toBe(0);
        expect(registry.register(element)).toBe(0);
        expect(registry.get(0)).toBe(element);
    });

    it('distinguishes DOM elements with identical attributes', () => {
        // Given
        const registry = new ElementRegistry();
        const first = document.createElement('section');
        first.id = 'section';
        const second = first.cloneNode() as Element;

        // When
        const firstId = registry.register(first);
        const secondId = registry.register(second);
        first.id = 'renamed';

        // Then
        expect(secondId).not.toBe(firstId);
        expect(registry.register(first)).toBe(firstId);
        expect(registry.get(firstId)).toBe(first);
        expect(registry.get(secondId)).toBe(second);
    });

    it('returns undefined for an unregistered ID', () => {
        expect(new ElementRegistry().get(0)).toBeUndefined();
    });
});
