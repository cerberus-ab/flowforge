import { beforeEach, describe, expect, it } from 'vitest';

import { EmbedSessionStorage } from './EmbedSessionStorage';

describe('EmbedSessionStorage', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    it('reads values from window.sessionStorage', async () => {
        window.sessionStorage.setItem('sessionKey', JSON.stringify({ question: 'How?' }));
        const storage = new EmbedSessionStorage();

        await expect(storage.get('sessionKey')).resolves.toEqual({ question: 'How?' });
    });

    it('returns null when a value is not stored', async () => {
        const storage = new EmbedSessionStorage();

        await expect(storage.get('missing')).resolves.toBeNull();
    });

    it('writes values to window.sessionStorage without changing localStorage', async () => {
        window.localStorage.setItem('persistentKey', 'persistent value');
        const storage = new EmbedSessionStorage();
        const value = { question: 'How?', status: 'pending' };

        await storage.set('sessionKey', value);

        expect(window.sessionStorage.getItem('sessionKey')).toBe(JSON.stringify(value));
        expect(window.localStorage.getItem('persistentKey')).toBe('persistent value');
    });

    it('clears sessionStorage without clearing localStorage', async () => {
        window.sessionStorage.setItem('sessionKey', 'temporary value');
        window.localStorage.setItem('persistentKey', 'persistent value');
        const storage = new EmbedSessionStorage();

        await storage.clear();

        expect(window.sessionStorage.length).toBe(0);
        expect(window.localStorage.getItem('persistentKey')).toBe('persistent value');
    });
});
