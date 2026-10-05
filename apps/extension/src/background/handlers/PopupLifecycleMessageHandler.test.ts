import { describe, expect, it, vi } from 'vitest';

import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import type { PopupInitializeMessage } from '@/types';
import { PopupLifecycleMessageHandler } from './PopupLifecycleMessageHandler';

describe('PopupLifecycleMessageHandler', () => {
    it('clears the page when the popup initializes', () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new PopupLifecycleMessageHandler(transport);
        const message: PopupInitializeMessage = { type: 'POPUP_INITIALISE', senderId: 7 };

        // When
        const response = handler.handle(message);

        // Then
        expect(response).toEqual({ success: true });
        expect(transport.getSentToPage()).toEqual([{ senderId: 7, message: { type: 'CLEAR_PAGE' } }]);
    });

    it('ignores a page clearing failure', async () => {
        // Given
        const transport = new FakeTransportService();
        vi.spyOn(transport, 'sendToPage').mockRejectedValue(new Error('Page unavailable'));
        const handler = new PopupLifecycleMessageHandler(transport);

        // When
        const response = handler.handle({ type: 'POPUP_INITIALISE', senderId: 7 } as PopupInitializeMessage);
        await Promise.resolve();

        // Then
        expect(response).toEqual({ success: true });
    });
});
