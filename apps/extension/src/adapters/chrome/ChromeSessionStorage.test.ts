import { describe, expect, it, vi } from 'vitest';

import { ChromeSessionStorage } from './ChromeSessionStorage';

describe('ChromeSessionStorage', () => {
    it('reads a value from chrome.storage.session', async () => {
        const session = stubChromeSession({ get: vi.fn().mockResolvedValue({ sessionKey: { question: 'How?' } }) });
        const storage = new ChromeSessionStorage();

        await expect(storage.get('sessionKey')).resolves.toEqual({ question: 'How?' });
        expect(session.get).toHaveBeenCalledWith('sessionKey');
    });

    it('returns null when a value is not stored', async () => {
        stubChromeSession({ get: vi.fn().mockResolvedValue({}) });
        const storage = new ChromeSessionStorage();

        await expect(storage.get('missing')).resolves.toBeNull();
    });

    it('writes values to chrome.storage.session', async () => {
        const session = stubChromeSession({ set: vi.fn().mockResolvedValue(undefined) });
        const storage = new ChromeSessionStorage();
        const value = { question: 'How?', status: 'pending' };

        await storage.set('sessionKey', value);

        expect(session.set).toHaveBeenCalledWith({ sessionKey: value });
    });

    it('clears chrome.storage.session', async () => {
        const session = stubChromeSession({ clear: vi.fn().mockResolvedValue(undefined) });
        const storage = new ChromeSessionStorage();

        await storage.clear();

        expect(session.clear).toHaveBeenCalledOnce();
    });
});

function stubChromeSession(overrides: Record<string, unknown> = {}) {
    const session = {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        clear: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
    vi.stubGlobal('chrome', { storage: { session } } as unknown as typeof chrome);
    return session;
}
