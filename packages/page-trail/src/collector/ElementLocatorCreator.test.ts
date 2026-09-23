import { describe, expect, it, vi } from 'vitest';

import { ElementLocatorCreator } from './ElementLocatorCreator';

describe('ElementLocatorCreator', () => {
    it('uses the supplied producer for the DOM locator', () => {
        const produceDataId = vi.fn(() => 'external-data-id');
        const creator = new ElementLocatorCreator(produceDataId);
        const element = document.createElement('button');

        const locator = creator.createFor(element);

        expect(locator).toEqual({ dataId: 'external-data-id', cssSelector: undefined });
        expect(produceDataId).toHaveBeenCalledExactlyOnceWith(element);
    });

    it('caches the locator for the same DOM element', () => {
        const produceDataId = vi.fn((el: Element) => el.id);
        const creator = new ElementLocatorCreator(produceDataId);
        const element = document.createElement('button');

        const locator = creator.createFor(element);

        expect(creator.createFor(element)).toBe(locator);
        expect(produceDataId).toHaveBeenCalledOnce();
    });

    it('creates a locator for each distinct DOM element', () => {
        // Given
        const produceDataId = vi.fn().mockReturnValueOnce('first').mockReturnValueOnce('second');
        const creator = new ElementLocatorCreator(produceDataId);
        const first = document.createElement('button');
        const second = document.createElement('button');

        // When
        const firstLocator = creator.createFor(first);
        const secondLocator = creator.createFor(second);

        // Then
        expect(firstLocator.dataId).toBe('first');
        expect(secondLocator.dataId).toBe('second');
        expect(produceDataId).toHaveBeenNthCalledWith(1, first);
        expect(produceDataId).toHaveBeenNthCalledWith(2, second);
        expect(creator.createFor(first)).toBe(firstLocator);
        expect(creator.createFor(second)).toBe(secondLocator);
        expect(produceDataId).toHaveBeenCalledTimes(2);
    });
});
