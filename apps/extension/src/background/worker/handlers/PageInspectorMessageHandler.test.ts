import { describe, expect, it, vi } from 'vitest';

import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { PageClient } from '@/page/client/PageClient';
import type { OpenPageInspectorMessage } from '@/messaging';
import { PageInspectorMessageHandler } from './PageInspectorMessageHandler';

describe('PageInspectorMessageHandler', () => {
    it('clears the page before opening the requested inspector tab', async () => {
        // Given
        const transport = new FakeTransportService();
        const handler = new PageInspectorMessageHandler(new PageClient(transport));
        const message: OpenPageInspectorMessage = {
            type: 'OPEN_PAGE_INSPECTOR',
            data: { tab: 'semantic' },
        };

        // When
        const response = await handler.handleOpenPageInspector(message, { pageId: 7 });

        // Then
        expect(response).toBeUndefined();
        expect(transport.getSentToPage()).toEqual([
            { pageId: 7, message: { type: 'CLEAR_PAGE' } },
            { pageId: 7, message: { type: 'OPEN_INSPECTOR', data: { tab: 'semantic' } } },
        ]);
    });

    it('does not open the inspector if clearing the page fails', async () => {
        // Given
        const transport = new FakeTransportService();
        const error = new Error('Page unavailable');
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.spyOn(transport, 'sendToPage').mockRejectedValue(error);
        const handler = new PageInspectorMessageHandler(new PageClient(transport));
        const message: OpenPageInspectorMessage = {
            type: 'OPEN_PAGE_INSPECTOR',
            data: {},
        };

        // When / Then
        await expect(handler.handleOpenPageInspector(message, { pageId: 7 })).rejects.toThrow('Page unavailable');
        expect(transport.sendToPage).toHaveBeenCalledOnce();
        expect(transport.sendToPage).toHaveBeenCalledWith(7, { type: 'CLEAR_PAGE' });
    });
});
