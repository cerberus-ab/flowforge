import { describe, expect, it, vi } from 'vitest';

import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { PageClient } from '@/page/client/PageClient';
import type { PageScopedMessage, PopupInitializeMessage } from '@/messaging';
import { PopupLifecycleMessageHandler } from './PopupLifecycleMessageHandler';

describe('PopupLifecycleMessageHandler', () => {
    it('clears the page when the popup initializes', () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new PopupLifecycleMessageHandler(new PageClient(transport));
        const message: PageScopedMessage<PopupInitializeMessage> = { type: 'POPUP_INITIALISE', pageId: 7 };

        // When
        const response = handler.handlePopupInitialize(message);

        // Then
        expect(response).toBeUndefined();
        expect(transport.getSentToPage()).toEqual([{ pageId: 7, message: { type: 'CLEAR_PAGE' } }]);
    });

    it('ignores a page clearing failure', async () => {
        // Given
        const transport = new FakeTransportService();
        vi.spyOn(transport, 'sendToPage').mockRejectedValue(new Error('Page unavailable'));
        const handler = new PopupLifecycleMessageHandler(new PageClient(transport));

        // When
        const response = handler.handlePopupInitialize({
            type: 'POPUP_INITIALISE',
            pageId: 7,
        } as PageScopedMessage<PopupInitializeMessage>);
        await Promise.resolve();

        // Then
        expect(response).toBeUndefined();
    });
});
