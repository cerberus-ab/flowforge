import { afterEach, describe, expect, it, vi } from 'vitest';

import { testDomRect } from '../../../../test/fixtures';
import { getElementBoundingBox, isAboveTheFold, isElementVisible, isInViewport } from './view';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('isElementVisible', () => {
    it('returns true for displayed elements with offset parent', () => {
        const el = visibleElement();

        expect(isElementVisible(el, window)).toBeTruthy();
    });

    it('returns false for hidden computed styles', () => {
        const hidden = visibleElement();
        vi.spyOn(window, 'getComputedStyle').mockReturnValue({
            display: 'none',
            visibility: 'visible',
            opacity: '1',
        } as CSSStyleDeclaration);

        expect(isElementVisible(hidden, window)).toBeFalsy();
    });

    it('returns false without offset parent', () => {
        const detached = document.createElement('div');
        Object.defineProperty(detached, 'offsetParent', {
            configurable: true,
            value: null,
        });

        expect(isElementVisible(detached, window)).toBeFalsy();
    });
});

describe('getElementBoundingBox', () => {
    it('maps DOMRect values to a bounding box', () => {
        const el = document.createElement('div');
        vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(testDomRect);

        expect(getElementBoundingBox(el)).toEqual({
            top: 0,
            left: 0,
            width: 100,
            height: 20,
            right: 100,
            bottom: 20,
        });
    });
});

describe('viewport helpers', () => {
    const viewport = { width: 1024, height: 600, scrollY: 100, scrollHeight: 2000 };

    it('detects whether a box intersects the viewport', () => {
        expect(isInViewport({ top: 0, bottom: 80, left: 0, right: 10, width: 10, height: 80 }, viewport)).toBeTruthy();
        expect(
            isInViewport({ top: 800, bottom: 900, left: 0, right: 10, width: 10, height: 100 }, viewport),
        ).toBeFalsy();
        expect(
            isInViewport({ top: -100, bottom: 0, left: 0, right: 10, width: 10, height: 100 }, viewport),
        ).toBeFalsy();
    });

    it('detects whether a box starts above the fold', () => {
        expect(
            isAboveTheFold({ top: 599, bottom: 620, left: 0, right: 10, width: 10, height: 21 }, viewport),
        ).toBeTruthy();
        expect(
            isAboveTheFold({ top: 600, bottom: 620, left: 0, right: 10, width: 10, height: 20 }, viewport),
        ).toBeFalsy();
    });
});

function visibleElement() {
    const el = document.createElement('div');

    Object.defineProperty(el, 'offsetParent', {
        configurable: true,
        value: document.body,
    });

    return el;
}
