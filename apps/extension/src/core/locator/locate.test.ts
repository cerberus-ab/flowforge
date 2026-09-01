import { describe, expect, it, vi } from 'vitest';

import { findElement, getOrCreateDataId } from './locate';

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
