import { vi } from 'vitest';

import { testDomRect } from './fixtures';

export function resetDocument() {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.title = '';
    document.documentElement.lang = '';
}

export function markVisible(selector: string, rect: DOMRect = testDomRect) {
    const el = document.querySelector(selector)!;

    Object.defineProperty(el, 'offsetParent', {
        configurable: true,
        value: document.body,
    });
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect);

    return el;
}

export function markHidden(selector: string) {
    const el = document.querySelector(selector)!;

    Object.defineProperty(el, 'offsetParent', {
        configurable: true,
        value: null,
    });

    return el;
}

export function setViewport(viewport: { width: number; height: number; scrollY: number; scrollHeight: number }) {
    Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: viewport.width,
    });
    Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        value: viewport.height,
    });
    Object.defineProperty(window, 'scrollY', {
        configurable: true,
        value: viewport.scrollY,
    });
    Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: viewport.scrollHeight,
    });
}
