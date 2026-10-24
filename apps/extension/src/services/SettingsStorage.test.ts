import { describe, expect, it } from 'vitest';

import { FakeStorage } from '../../test/unit/fakes/FakeStorage';
import { constants } from '@/shared/constants';
import { createSettingsFixture } from '../../test/fixtures';
import { SettingsStorage } from './SettingsStorage';

const settingsKey = `${constants.STORAGE_NAMESPACE}_settings`;

describe('SettingsStorage', () => {
    it('returns defaults when settings have not been stored', async () => {
        const defaults = createSettingsFixture();
        const storage = new SettingsStorage(new FakeStorage(), defaults);

        await expect(storage.get()).resolves.toEqual(defaults);
    });

    it('uses initial settings to override defaults', async () => {
        const storage = new SettingsStorage(new FakeStorage(), createSettingsFixture(), {
            devMode: true,
        });

        await expect(storage.get()).resolves.toEqual(createSettingsFixture({ devMode: true }));
    });

    it('merges stored settings over defaults and initial settings', async () => {
        // Given
        const fakeStorage = new FakeStorage();
        await fakeStorage.set(settingsKey, { theme: 'dark' });
        const storage = new SettingsStorage(fakeStorage, createSettingsFixture(), {
            devMode: true,
        });

        // When / Then
        await expect(storage.get()).resolves.toEqual(createSettingsFixture({ theme: 'dark', devMode: true }));
    });

    it('updates settings by merging the patch with stored values', async () => {
        // Given
        const fakeStorage = new FakeStorage();
        await fakeStorage.set(settingsKey, { theme: 'dark' });
        const storage = new SettingsStorage(fakeStorage, createSettingsFixture());

        // When / Then
        await expect(storage.update({ devMode: true })).resolves.toEqual(
            createSettingsFixture({ theme: 'dark', devMode: true }),
        );
        await expect(fakeStorage.get(settingsKey)).resolves.toEqual({
            theme: 'dark',
            devMode: true,
        });
    });

    it('falls back for invalid stored Inspector and Markdown preferences', async () => {
        // Given
        const fakeStorage = new FakeStorage();
        await fakeStorage.set(settingsKey, {
            inspectorTab: 'not-a-tab',
            markdownDetailLevel: 'verbose',
            markdownBlocks: ['basics', 'unknown', 'basics'],
        });
        const storage = new SettingsStorage(fakeStorage, createSettingsFixture());

        // When / Then
        await expect(storage.get()).resolves.toEqual(createSettingsFixture({ markdownBlocks: ['basics'] }));
    });

    it('persists Inspector and Markdown preferences through a settings patch', async () => {
        // Given
        const storage = new SettingsStorage(new FakeStorage(), createSettingsFixture());

        // When
        const result = await storage.update({
            inspectorTab: 'markdown',
            markdownDetailLevel: 'compact',
            markdownBlocks: ['basics', 'content'],
        });

        // Then
        expect(result.inspectorTab).toBe('markdown');
        expect(result.markdownDetailLevel).toBe('compact');
        expect(result.markdownBlocks).toEqual(['basics', 'content']);
    });

    it('keeps separate settings patches when updates overlap', async () => {
        // Given
        const storage = new SettingsStorage(new FakeStorage(), createSettingsFixture());

        // When
        await Promise.all([
            storage.update({ inspectorTab: 'markdown' }),
            storage.update({ markdownDetailLevel: 'full' }),
        ]);

        // Then
        await expect(storage.get()).resolves.toEqual(
            createSettingsFixture({ inspectorTab: 'markdown', markdownDetailLevel: 'full' }),
        );
    });
});
