import { describe, expect, it, vi } from 'vitest';

import type { Storage } from '@/adapters';
import { FakeStorage } from '../../../test/unit/fakes/FakeStorage';
import { constants } from '../constants';
import { HistoryStorage } from './HistoryStorage';

const historyKey = (domain: string) => `${constants.STORAGE_NAMESPACE}_history::${domain}`;

describe('HistoryStorage', () => {
    it('returns an empty history when no questions are stored for the domain', async () => {
        const storage = new HistoryStorage(new FakeStorage(), 5);

        await expect(storage.getPreviousQuestions('example.com')).resolves.toEqual([]);
    });

    it('saves questions in LIFO order under the domain-specific key', async () => {
        // Given
        const fakeStorage = new FakeStorage();
        const storage = new HistoryStorage(fakeStorage, 5);

        // When
        await storage.saveQuestion('example.com', 'first');
        await storage.saveQuestion('example.com', 'second');

        // Then
        await expect(storage.getPreviousQuestions('example.com')).resolves.toEqual(['second', 'first']);
        await expect(fakeStorage.get(historyKey('example.com'))).resolves.toEqual(['second', 'first']);
        await expect(fakeStorage.get(historyKey('other.example.com'))).resolves.toBeNull();
    });

    it('keeps only the configured number of recent questions', async () => {
        // Given
        const storage = new HistoryStorage(new FakeStorage(), 2);

        // When
        await storage.saveQuestion('example.com', 'first');
        await storage.saveQuestion('example.com', 'second');
        await storage.saveQuestion('example.com', 'third');

        // Then
        await expect(storage.getPreviousQuestions('example.com')).resolves.toEqual(['third', 'second']);
    });

    it('propagates errors when reading history fails', async () => {
        // Given
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const failingStorage: Storage = {
            get: vi.fn().mockRejectedValue(new Error('storage unavailable')),
            set: vi.fn(),
            remove: vi.fn(),
            clear: vi.fn(),
        };
        const storage = new HistoryStorage(failingStorage, 5);

        // When / Then
        await expect(storage.getPreviousQuestions('example.com')).rejects.toThrow('storage unavailable');
        expect(consoleError).not.toHaveBeenCalled();
    });

    it('propagates errors when saving history fails', async () => {
        // Given
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const failingStorage: Storage = {
            get: vi.fn().mockResolvedValue([]),
            set: vi.fn().mockRejectedValue(new Error('quota exceeded')),
            remove: vi.fn(),
            clear: vi.fn(),
        };
        const storage = new HistoryStorage(failingStorage, 5);

        // When / Then
        await expect(storage.saveQuestion('example.com', 'question')).rejects.toThrow('quota exceeded');
        expect(consoleError).not.toHaveBeenCalled();
    });
});
