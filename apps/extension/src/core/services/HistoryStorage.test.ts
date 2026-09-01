import { describe, expect, it, vi } from 'vitest';

import type { LocalStorage } from '@/adapters/interface';
import { FakeLocalStorage } from '../../../test/unit/fakes/FakeLocalStorage';
import { constants } from '../constants';
import { HistoryStorage } from './HistoryStorage';

const historyKey = (domain: string) => `${constants.LOCAL_STORAGE_NAMESPACE}_history_${domain}`;

describe('HistoryStorage', () => {
    it('returns an empty history when no questions are stored for the domain', async () => {
        const storage = new HistoryStorage(new FakeLocalStorage(), 5);

        await expect(storage.getPreviousQuestions('example.com')).resolves.toEqual([]);
    });

    it('saves questions in LIFO order under the domain-specific key', async () => {
        // Given
        const localStorage = new FakeLocalStorage();
        const storage = new HistoryStorage(localStorage, 5);

        // When
        await storage.saveQuestion('example.com', 'first');
        await storage.saveQuestion('example.com', 'second');

        // Then
        await expect(storage.getPreviousQuestions('example.com')).resolves.toEqual(['second', 'first']);
        await expect(localStorage.get(historyKey('example.com'))).resolves.toEqual(['second', 'first']);
        await expect(localStorage.get(historyKey('other.example.com'))).resolves.toBeNull();
    });

    it('keeps only the configured number of recent questions', async () => {
        // Given
        const storage = new HistoryStorage(new FakeLocalStorage(), 2);

        // When
        await storage.saveQuestion('example.com', 'first');
        await storage.saveQuestion('example.com', 'second');
        await storage.saveQuestion('example.com', 'third');

        // Then
        await expect(storage.getPreviousQuestions('example.com')).resolves.toEqual(['third', 'second']);
    });

    it('fails safely when reading history throws', async () => {
        // Given
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const failingStorage: LocalStorage = {
            get: vi.fn().mockRejectedValue(new Error('storage unavailable')),
            set: vi.fn(),
            clear: vi.fn(),
        };
        const storage = new HistoryStorage(failingStorage, 5);

        // When / Then
        await expect(storage.getPreviousQuestions('example.com')).resolves.toEqual([]);

        expect(consoleError).toHaveBeenCalledWith('[Background] Error getting previous questions:', expect.any(Error));
    });

    it('swallows write failures after logging them', async () => {
        // Given
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const failingStorage: LocalStorage = {
            get: vi.fn().mockResolvedValue([]),
            set: vi.fn().mockRejectedValue(new Error('quota exceeded')),
            clear: vi.fn(),
        };
        const storage = new HistoryStorage(failingStorage, 5);

        // When / Then
        await expect(storage.saveQuestion('example.com', 'question')).resolves.toBeUndefined();

        expect(consoleError).toHaveBeenCalledWith('[Background] Error saving question:', expect.any(Error));
    });
});
