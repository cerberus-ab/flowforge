import { beforeEach, describe, expect, it } from 'vitest';

import { EmbedLocalStorage } from './EmbedLocalStorage';

describe('EmbedLocalStorage', () => {
    beforeEach(() => {
        window.localStorage.clear();
        window.sessionStorage.clear();
    });

    it('reads values from window.localStorage', async () => {
        window.localStorage.setItem('localKey', JSON.stringify({ setting: 'dark' }));
        const storage = new EmbedLocalStorage();

        await expect(storage.get('localKey')).resolves.toEqual({ setting: 'dark' });
    });

    it('returns null when a value is not stored', async () => {
        const storage = new EmbedLocalStorage();

        await expect(storage.get('missing')).resolves.toBeNull();
    });

    it('writes values to window.localStorage without changing sessionStorage', async () => {
        window.sessionStorage.setItem('temporaryKey', 'temporary value');
        const storage = new EmbedLocalStorage();
        const value = { setting: 'dark' };

        await storage.set('localKey', value);

        expect(window.localStorage.getItem('localKey')).toBe(JSON.stringify(value));
        expect(window.sessionStorage.getItem('temporaryKey')).toBe('temporary value');
    });

    it('removes only the requested local key', async () => {
        window.localStorage.setItem('historyKey', 'remove me');
        window.localStorage.setItem('settingsKey', 'keep me');
        const storage = new EmbedLocalStorage();

        await storage.remove('historyKey');

        expect(window.localStorage.getItem('historyKey')).toBeNull();
        expect(window.localStorage.getItem('settingsKey')).toBe('keep me');
    });

    it('clears localStorage without clearing sessionStorage', async () => {
        window.localStorage.setItem('persistentKey', 'persistent value');
        window.sessionStorage.setItem('temporaryKey', 'temporary value');
        const storage = new EmbedLocalStorage();

        await storage.clear();

        expect(window.localStorage.length).toBe(0);
        expect(window.sessionStorage.getItem('temporaryKey')).toBe('temporary value');
    });
});
