import { describe, expect, it } from 'vitest';

import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import { PopupClient } from './PopupClient';

describe('PopupClient', () => {
    it('notifies the popup that a query finished for the requested page', async () => {
        // Given
        const transport = new FakeTransportService();
        const client = new PopupClient(transport);

        // When
        await client.notifyQueryFinished(42, 'query-1');

        // Then
        expect(transport.getSentToPopup()).toEqual([
            {
                pageId: 42,
                message: {
                    type: 'QUERY_FINISHED',
                    data: { queryId: 'query-1' },
                },
            },
        ]);
    });
});
