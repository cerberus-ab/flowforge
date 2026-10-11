import { describe, expect, it } from 'vitest';

import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import { PopupClient } from './PopupClient';

describe('PopupClient', () => {
    it('notifies popup contexts that a query finished', async () => {
        // Given
        const transport = new FakeTransportService();
        const client = new PopupClient(transport);

        // When
        await client.notifyQueryFinished('query-1');

        // Then
        expect(transport.getSentToPopup()).toEqual([
            {
                message: {
                    type: 'QUERY_FINISHED',
                    data: { queryId: 'query-1' },
                },
            },
        ]);
    });
});
