import { afterEach, describe, expect, it, vi } from 'vitest';

import { testDomRect } from '../../test/fixtures';
import { extractElementDescriptor } from './descriptor';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('extractElementDescriptor', () => {
    it('extracts tag, data id, selector, and bounding box', () => {
        document.body.innerHTML = `<button id="save-button">Save</button>`;
        const button = document.querySelector('button')!;

        vi.spyOn(button, 'getBoundingClientRect').mockReturnValue(testDomRect);

        const descriptor = extractElementDescriptor(button, (el) => `data-${el.id}`);

        expect(descriptor).toEqual({
            tag: 'button',
            dataId: 'data-save-button',
            selector: expect.any(String),
            bbox: {
                top: 0,
                left: 0,
                width: 100,
                height: 20,
                right: 100,
                bottom: 20,
            },
        });
        expect(document.querySelector(descriptor.selector)).toBe(button);
    });
});
