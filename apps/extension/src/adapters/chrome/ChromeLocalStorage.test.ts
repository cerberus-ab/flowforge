import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChromeLocalStorage } from './ChromeLocalStorage';

describe('ChromeLocalStorage', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reads a value from chrome.storage.local', async () => {
        const local = stubChromeLocal({ get: vi.fn().mockResolvedValue({ localKey: { setting: 'dark' } }) });
        const storage = new ChromeLocalStorage();

        await expect(storage.get('localKey')).resolves.toEqual({ setting: 'dark' });
        expect(local.get).toHaveBeenCalledWith('localKey');
    });

    it('returns null when a value is not stored', async () => {
        stubChromeLocal({ get: vi.fn().mockResolvedValue({}) });
        const storage = new ChromeLocalStorage();

        await expect(storage.get('missing')).resolves.toBeNull();
    });

    it('writes values to chrome.storage.local', async () => {
        const local = stubChromeLocal({ set: vi.fn().mockResolvedValue(undefined) });
        const storage = new ChromeLocalStorage();
        const value = { setting: 'dark' };

        await storage.set('localKey', value);

        expect(local.set).toHaveBeenCalledWith({ localKey: value });
    });

    it('removes a key from chrome.storage.local', async () => {
        const local = stubChromeLocal({ remove: vi.fn().mockResolvedValue(undefined) });
        const storage = new ChromeLocalStorage();

        await storage.remove('localKey');

        expect(local.remove).toHaveBeenCalledWith('localKey');
    });

    it('clears chrome.storage.local', async () => {
        const local = stubChromeLocal({ clear: vi.fn().mockResolvedValue(undefined) });
        const storage = new ChromeLocalStorage();

        await storage.clear();

        expect(local.clear).toHaveBeenCalledOnce();
    });
});

function stubChromeLocal(overrides: Record<string, unknown> = {}) {
    const local = {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
    vi.stubGlobal('chrome', { storage: { local } } as unknown as typeof chrome);
    return local;
}
