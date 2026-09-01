import { afterEach, vi } from 'vitest';

afterEach(() => {
    document.body.replaceChildren();
    document.head.replaceChildren();
    window.localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});
