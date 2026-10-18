import { createQueryResponseFixture } from '../../test/unit/fakes/FakeApiClient';
import { FakeStorage } from '../../test/unit/fakes/FakeStorage';
import { constants } from '@/shared/constants';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it } from 'vitest';
import { QuerySessionStorage } from './QuerySessionStorage';

const querySessionKey = (pageId: number) => `${constants.STORAGE_NAMESPACE}_query_session::${pageId}`;

describe('QuerySessionStorage', () => {
    it('saves a pending question session scoped to its page', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);

        // When
        await querySessionStorage.savePending(7, 'query-7', 'https://app.example/settings', {
            question: 'How do I save?',
        });

        // Then
        await expect(storage.get(querySessionKey(7))).resolves.toEqual({
            queryId: 'query-7',
            url: 'https://app.example/settings',
            state: 'pending',
            data: { question: 'How do I save?' },
        });
        await expect(storage.get(querySessionKey(8))).resolves.toBeNull();
    });

    it('updates the matching pending session to completed and preserves its question', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);
        const response = createQueryResponseFixture();
        const pageTrailDto = createPageTrailDtoFixture();

        await querySessionStorage.savePending(7, 'query-7', 'https://app.example/settings', {
            question: 'Original question',
        });

        // When
        await expect(
            querySessionStorage.updateCompleted(7, 'query-7', {
                result: response.result,
                metadata: response.metadata,
                trailSnapshot: pageTrailDto.metadata.snapshot,
            }),
        ).resolves.toBe(true);

        // Then
        await expect(storage.get(querySessionKey(7))).resolves.toEqual({
            queryId: 'query-7',
            url: 'https://app.example/settings',
            state: 'completed',
            data: {
                question: 'Original question',
                result: response.result,
                metadata: response.metadata,
                trailSnapshot: pageTrailDto.metadata.snapshot,
            },
        });
    });

    it('does not complete a session for another query or from a non-pending state', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);
        const response = createQueryResponseFixture();
        const completedData = {
            result: response.result,
            metadata: response.metadata,
            trailSnapshot: createPageTrailDtoFixture().metadata.snapshot,
        };
        await querySessionStorage.savePending(7, 'query-7', 'https://app.example/settings', {
            question: 'How do I save?',
        });

        // When / Then
        await expect(querySessionStorage.updateCompleted(7, 'other-query', completedData)).resolves.toBe(false);
        await expect(querySessionStorage.updateCompleted(8, 'query-7', completedData)).resolves.toBe(false);
        await expect(querySessionStorage.updateCompleted(7, 'query-7', completedData)).resolves.toBe(true);
        await expect(querySessionStorage.updateCompleted(7, 'query-7', completedData)).resolves.toBe(false);
    });

    it('stores an error outcome as completed', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);
        await querySessionStorage.savePending(7, 'query-7', 'https://app.example/settings', {
            question: 'How do I save?',
        });

        // When / Then
        await expect(querySessionStorage.updateCompleted(7, 'query-7', { error: 'Backend unavailable' })).resolves.toBe(
            true,
        );
        await expect(storage.get(querySessionKey(7))).resolves.toEqual({
            queryId: 'query-7',
            url: 'https://app.example/settings',
            state: 'completed',
            data: { question: 'How do I save?', error: 'Backend unavailable' },
        });
    });

    it('returns the saved session for a page', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);
        await querySessionStorage.savePending(7, 'query-7', 'https://app.example/settings', {
            question: 'How do I save?',
        });

        // When / Then
        await expect(querySessionStorage.getRecord(7)).resolves.toEqual({
            queryId: 'query-7',
            url: 'https://app.example/settings',
            state: 'pending',
            data: { question: 'How do I save?' },
        });
    });

    it('returns null when a page has no saved session', async () => {
        // Given
        const querySessionStorage = new QuerySessionStorage(new FakeStorage());

        // When / Then
        await expect(querySessionStorage.getRecord(7)).resolves.toBeNull();
    });

    it('removes only the session for the requested page', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);
        await querySessionStorage.savePending(7, 'query-7', 'https://app.example/settings', {
            question: 'How do I save?',
        });
        await querySessionStorage.savePending(8, 'query-8', 'https://app.example/settings', {
            question: 'How do I cancel?',
        });

        // When
        await querySessionStorage.removeRecord(7);

        // Then
        await expect(storage.get(querySessionKey(7))).resolves.toBeNull();
        await expect(storage.get(querySessionKey(8))).resolves.toMatchObject({
            data: { question: 'How do I cancel?' },
        });
    });

    it('removes only the matching completed query', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);
        await querySessionStorage.savePending(7, 'query-7', 'https://app.example/settings', {
            question: 'How do I save?',
        });
        await querySessionStorage.savePending(8, 'query-8', 'https://app.example/settings', {
            question: 'How do I cancel?',
        });

        // When / Then
        await expect(querySessionStorage.removeCompleted(7, 'query-7')).resolves.toBe(false);
        await querySessionStorage.updateCompleted(7, 'query-7', { error: 'Unavailable' });
        await expect(querySessionStorage.removeCompleted(7, 'other-query')).resolves.toBe(false);
        await expect(querySessionStorage.removeCompleted(7, 'query-7')).resolves.toBe(true);
        await expect(querySessionStorage.getRecord(7)).resolves.toBeNull();
        await expect(querySessionStorage.getRecord(8)).resolves.toMatchObject({ queryId: 'query-8' });
    });
});
