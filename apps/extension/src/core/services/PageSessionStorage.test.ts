import { createQueryResponseFixture } from '../../../test/unit/fakes/FakeApiClient';
import { FakeStorage } from '../../../test/unit/fakes/FakeStorage';
import { constants } from '@/constants';
import { createPageTrailDtoFixture } from '@flowforge/page-trail/testing';
import { describe, expect, it } from 'vitest';
import { PageSessionStorage } from './PageSessionStorage';

const pageSessionKey = (pageId: number) => `${constants.STORAGE_NAMESPACE}_page_session::${pageId}`;

describe('PageSessionStorage', () => {
    it('saves a pending question session scoped to its page', async () => {
        // Given
        const storage = new FakeStorage();
        const pageSessionStorage = new PageSessionStorage(storage);

        // When
        await pageSessionStorage.savePending(7, 'https://app.example/settings', {
            question: 'How do I save?',
        });

        // Then
        await expect(storage.get(pageSessionKey(7))).resolves.toEqual({
            url: 'https://app.example/settings',
            state: 'pending',
            data: { question: 'How do I save?' },
        });
        await expect(storage.get(pageSessionKey(8))).resolves.toBeNull();
    });

    it('saves a completed session with the question, response metadata, and page snapshot', async () => {
        // Given
        const storage = new FakeStorage();
        const pageSessionStorage = new PageSessionStorage(storage);
        const response = createQueryResponseFixture();
        const pageTrailDto = createPageTrailDtoFixture();

        // When
        await pageSessionStorage.saveCompleted(7, 'https://app.example/settings', {
            question: 'How do I save?',
            result: response.result,
            metadata: response.metadata,
            trailSnapshot: pageTrailDto.metadata.snapshot,
        });

        // Then
        await expect(storage.get(pageSessionKey(7))).resolves.toEqual({
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
});
