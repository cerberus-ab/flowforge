import { describe, expect, it } from 'vitest';

import { collectPageTrail, collectPageTrailContextOnly, containsElements } from './collect';

const dataIdAttribute = 'data-flowforge-id';

describe('containsElements', () => {
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

describe('page trail collection', () => {
    it('collects locators and assigns data IDs for query context', () => {
        // Given
        document.body.innerHTML = '<button>Save</button>';

        // When
        const trail = collectPageTrail(window, document);

        // Then
        const dataId = document.querySelector('button')?.getAttribute(dataIdAttribute);
        expect(dataId).toMatch(/^ff/);
        expect(trail.metadata.snapshot.contextOnly).toBe(false);
        expect(trail.getInteractive()[0]?.locator?.dataId).toBe(dataId);
    });

    it('collects inspector context without locators or assigning data IDs', () => {
        // Given
        document.body.innerHTML = '<button>Save</button>';

        // When
        const trail = collectPageTrailContextOnly(window, document);

        // Then
        expect(trail.metadata.snapshot.contextOnly).toBe(true);
        expect(trail.getInteractive()[0]?.locator).toBeUndefined();
        expect(document.querySelector('button')?.hasAttribute(dataIdAttribute)).toBe(false);
    });
});
