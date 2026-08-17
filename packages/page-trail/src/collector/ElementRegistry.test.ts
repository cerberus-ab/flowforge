import { describe, expect, it, vi } from 'vitest';

import { ElementRegistry } from './ElementRegistry';

describe('ElementRegistry', () => {
    it('resolves registered elements by data ID and data IDs by element', () => {
        const registry = new ElementRegistry((el) => el.id);
        const element = document.createElement('section');
        element.id = 'section';

        const dataId = registry.register(element);

        expect(dataId).toBe('section');
        expect(registry.get('section')).toBe(element);
    });

    it('returns an existing data ID when registering the same element again', () => {
        const produceDataId = vi.fn((el: Element) => el.id);
        const registry = new ElementRegistry(produceDataId);
        const element = document.createElement('section');
        element.id = 'section';

        expect(registry.register(element)).toBe('section');
        expect(registry.register(element)).toBe('section');
        expect(produceDataId).toHaveBeenCalledOnce();
    });

});
