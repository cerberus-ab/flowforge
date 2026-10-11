import { createQueryResponseFixture } from '../../../test/unit/fakes/FakeApiClient';
import { FakeStorage } from '../../../test/unit/fakes/FakeStorage';
import { constants } from '@/constants';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it } from 'vitest';
import { QuerySessionStorage } from './QuerySessionStorage';

const querySessionKey = (pageId: number) => `${constants.STORAGE_NAMESPACE}_query_session::${pageId}`;

describe('QuerySessionStorage', () => {
    it('saves a ready question session scoped to its page', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);

        // When
        await querySessionStorage.saveReady(7, 'https://app.example/settings', {
            question: 'How do I save?',
        });

        // Then
        await expect(storage.get(querySessionKey(7))).resolves.toEqual({
            url: 'https://app.example/settings',
            state: 'ready',
            data: { question: 'How do I save?' },
        });
        await expect(storage.get(querySessionKey(8))).resolves.toBeNull();
    });

    it('saves a completed session with the question, response metadata, and page snapshot', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);
        const response = createQueryResponseFixture();
        const pageTrailDto = createPageTrailDtoFixture();

        // When
        await querySessionStorage.saveCompleted(7, 'https://app.example/settings', {
            question: 'How do I save?',
            result: response.result,
            metadata: response.metadata,
            trailSnapshot: pageTrailDto.metadata.snapshot,
        });

        // Then
        await expect(storage.get(querySessionKey(7))).resolves.toEqual({
            url: 'https://app.example/settings',
            state: 'completed',
            data: {
                question: 'How do I save?',
                result: response.result,
                metadata: response.metadata,
                trailSnapshot: pageTrailDto.metadata.snapshot,
            },
        });
    });

    it('returns the saved session for a page', async () => {
        // Given
        const storage = new FakeStorage();
        const querySessionStorage = new QuerySessionStorage(storage);
        await querySessionStorage.saveReady(7, 'https://app.example/settings', {
            question: 'How do I save?',
        });

        // When / Then
        await expect(querySessionStorage.getRecord(7)).resolves.toEqual({
            url: 'https://app.example/settings',
            state: 'ready',
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
        await querySessionStorage.saveReady(7, 'https://app.example/settings', {
            question: 'How do I save?',
        });
        await querySessionStorage.saveReady(8, 'https://app.example/settings', {
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
});
