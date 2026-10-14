import { describe, expect, it, vi } from 'vitest';

import { containsElements, findDataIds, findElement, getOrCreateDataId } from './locate';

const dataIdAttribute = 'data-flowforge-id';

describe('getOrCreateDataId', () => {
    it('reuses an existing data id', () => {
        const element = document.createElement('button');
        element.setAttribute(dataIdAttribute, 'existing-id');

        expect(getOrCreateDataId(element)).toBe('existing-id');
    });

    it('creates and stores a data id when one is missing', () => {
        const element = document.createElement('button');

        const dataId = getOrCreateDataId(element);

        expect(dataId).toMatch(/^ff/);
        expect(element.getAttribute(dataIdAttribute)).toBe(dataId);
    });
});

describe('findDataIds', () => {
    it('returns all data ids in document order', () => {
        document.body.innerHTML = `
            <button ${dataIdAttribute}="ff00000002">Second</button>
            <div ${dataIdAttribute}="ff00000001"></div>
            <span ${dataIdAttribute}="invalid-id"></span>
        `;

        expect(findDataIds(document)).toEqual(['ff00000002', 'ff00000001']);
    });

    it('returns an empty array when the document has no data ids', () => {
        document.body.innerHTML = '<button>Save</button>';

        expect(findDataIds(document)).toEqual([]);
    });
});

describe('containsDataIds', () => {
    it('finds all requested IDs, including IDs on hidden elements', () => {
        // Given
        document.body.innerHTML = `
            <button ${dataIdAttribute}="ff00000001">Save</button>
            <div hidden ${dataIdAttribute}="ff00000002">Hidden slide</div>
            <span ${dataIdAttribute}="ff00000003">Unrelated</span>
        `;

        // When / Then
        expect(containsElements(document, ['ff00000001', 'ff00000002'])).toBe(true);
    });

    it('returns false when a requested ID is missing or invalid', () => {
        // Given
        document.body.innerHTML = `
            <button ${dataIdAttribute}="ff00000001">Save</button>
            <div ${dataIdAttribute}="invalid-id">Other</div>
        `;

        // When / Then
        expect(containsElements(document, ['ff00000001', 'ff00000002'])).toBe(false);
        expect(containsElements(document, ['invalid-id'])).toBe(false);
    });

    it('accepts an empty list of requested IDs', () => {
        // Given
        document.body.innerHTML = '<button>Save</button>';

        // When / Then
        expect(containsElements(document, [])).toBe(true);
    });
});

describe('findElement', () => {
    it('finds an element by data id', () => {
        document.body.innerHTML = `<button ${dataIdAttribute}="target-id">Save</button>`;

        expect(findElement(document, 'target-id')).toBe(document.querySelector('button'));
    });

    it('falls back to a CSS selector', () => {
        document.body.innerHTML = '<button id="save">Save</button>';

        expect(findElement(document, 'missing-id', '#save')).toBe(document.getElementById('save'));
    });

    it('warns when no element is found', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        expect(findElement(document, 'missing-id', '#missing')).toBeNull();
        expect(warn).toHaveBeenCalledWith('[FlowForge] Element not found:', {
            dataId: 'missing-id',
            fallbackSelector: '#missing',
        });
    });
});
