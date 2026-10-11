import { describe, expect, it, vi } from 'vitest';

import { EmbedTransportService } from '@/adapters';

describe('EmbedTransportService', () => {
    it('uses the current window as the sender context', async () => {
        window.history.replaceState(null, '', '/start');
        const transport = new EmbedTransportService();

        await expect(transport.getActivePageContext()).resolves.toEqual({ pageId: 1 });
        await expect(transport.getPageUrl()).resolves.toBe('http://localhost:3000/start');
    });

    it('dispatches background and page messages to registered handlers', async () => {
        const transport = new EmbedTransportService();
        const backgroundMessage = { type: 'GET_SETTINGS' } as const;
        const pageMessage = { type: 'CLEAR_PAGE' } as const;

        transport.addMessageListener((received) => {
            if (received.type === 'GET_SETTINGS') {
                return { success: true, data: { devMode: true } };
            }
            if (received.type === 'CLEAR_PAGE') return { success: true };
        });

        await expect(transport.sendToBackground(backgroundMessage, { pageId: 1 })).resolves.toEqual({
            success: true,
            data: { devMode: true },
        });
        await expect(transport.sendToPage(1, pageMessage)).resolves.toEqual({ success: true });
    });

    it('unsubscribes listeners', async () => {
        const transport = new EmbedTransportService();
        const unsubscribe = transport.addMessageListener(() => ({ success: true }));

        unsubscribe();

        await expect(transport.sendToBackground({ type: 'GET_SETTINGS' }, { pageId: 1 })).rejects.toThrow(
            'Message handler is not registered',
        );
    });

    it('broadcasts popup notifications to registered message listeners', async () => {
        const transport = new EmbedTransportService();
        const handler = vi.fn(() => ({ success: true }) as const);
        transport.addMessageListener(handler);
        const message = { type: 'QUERY_FINISHED', data: { queryId: 'query-1' } } as const;

        await transport.sendToPopup(message, { pageId: 1 });

        expect(handler).toHaveBeenCalledWith(message, { pageId: 1 });
    });

    it('throws when no handler responds', async () => {
        const transport = new EmbedTransportService();
        transport.addMessageListener(() => undefined);

        await expect(transport.sendToBackground({ type: 'GET_SETTINGS' }, { pageId: 1 })).rejects.toThrow(
            'Message handler did not return a response',
        );
    });
});
