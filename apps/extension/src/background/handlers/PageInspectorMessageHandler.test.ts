import { describe, expect, it, vi } from 'vitest';

import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import type { OpenPageInspectorMessage } from '@/types';
import { PageInspectorMessageHandler } from './PageInspectorMessageHandler';

describe('PageInspectorMessageHandler', () => {
    it('clears the page before opening the requested inspector tab', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new PageInspectorMessageHandler(transport);
        const message: OpenPageInspectorMessage = {
            type: 'OPEN_PAGE_INSPECTOR',
            senderId: 7,
            data: { tab: 'semantic' },
        };

        // When
        const response = await handler.handle(message);

        // Then
        expect(response).toEqual({ success: true });
        expect(transport.getSentToPage()).toEqual([
            { senderId: 7, message: { type: 'CLEAR_PAGE' } },
            { senderId: 7, message: { type: 'OPEN_INSPECTOR', data: { tab: 'semantic' } } },
        ]);
    });

    it('does not open the inspector if clearing the page fails', async () => {
        // Given
        const transport = new FakeTransportService();
        const error = new Error('Page unavailable');
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.spyOn(transport, 'sendToPage').mockRejectedValue(error);
        const handler = new PageInspectorMessageHandler(transport);
        const message: OpenPageInspectorMessage = {
            type: 'OPEN_PAGE_INSPECTOR',
            senderId: 7,
            data: {},
        };

        // When / Then
        await expect(handler.handle(message)).rejects.toThrow('Page unavailable');
        expect(transport.sendToPage).toHaveBeenCalledOnce();
        expect(transport.sendToPage).toHaveBeenCalledWith(7, { type: 'CLEAR_PAGE' });
    });
});
