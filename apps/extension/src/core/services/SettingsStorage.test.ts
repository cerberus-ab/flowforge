import { describe, expect, it } from 'vitest';

import { FakeLocalStorage } from '../../../test/fakes/FakeLocalStorage';
import { constants } from '../constants';
import { SettingsStorage } from './SettingsStorage';

const settingsKey = `${constants.LOCAL_STORAGE_NAMESPACE}_settings`;

describe('SettingsStorage', () => {
    it('returns defaults when settings have not been stored', async () => {
        const storage = new SettingsStorage(new FakeLocalStorage(), {
            theme: 'light',
            devMode: false,
        });

        await expect(storage.get()).resolves.toEqual({
            theme: 'light',
            devMode: false,
        });
    });

    it('uses initial settings to override defaults', async () => {
        const storage = new SettingsStorage(
            new FakeLocalStorage(),
            {
                theme: 'light',
                devMode: false,
            },
            {
                devMode: true,
            },
        );

        await expect(storage.get()).resolves.toEqual({
            theme: 'light',
            devMode: true,
        });
    });

    it('merges stored settings over defaults and initial settings', async () => {
        // Given
        const localStorage = new FakeLocalStorage();
        await localStorage.set(settingsKey, { theme: 'dark' });
        const storage = new SettingsStorage(
            localStorage,
            {
                theme: 'light',
                devMode: false,
            },
            {
                devMode: true,
            },
        );

        // When / Then
        await expect(storage.get()).resolves.toEqual({
            theme: 'dark',
            devMode: true,
        });
    });

    it('updates settings by merging the patch with stored values', async () => {
        // Given
        const localStorage = new FakeLocalStorage();
        await localStorage.set(settingsKey, { theme: 'dark' });
        const storage = new SettingsStorage(localStorage, {
            theme: 'light',
            devMode: false,
        });

        // When / Then
        await expect(storage.update({ devMode: true })).resolves.toEqual({
            theme: 'dark',
            devMode: true,
        });
        await expect(localStorage.get(settingsKey)).resolves.toEqual({
            theme: 'dark',
            devMode: true,
        });
    });
});
