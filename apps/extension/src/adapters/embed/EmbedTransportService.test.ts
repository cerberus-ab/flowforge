import { describe, expect, it } from 'vitest';

import { EmbedTransportService } from './EmbedTransportService';

describe('EmbedTransportService', () => {
    it('uses the current window as the sender context', async () => {
        window.history.replaceState(null, '', '/start');
        const transport = new EmbedTransportService();

        await expect(transport.getActiveSenderId()).resolves.toBe(1);
        await expect(transport.getSenderHostname()).resolves.toBe('localhost');
    });

    it('dispatches background and page messages to registered handlers', async () => {
        const transport = new EmbedTransportService();
        const message = { type: 'GET_SETTINGS' } as const;

        transport.addMessageListener((received) => {
            if (received.type === 'GET_SETTINGS') {
                return { success: true, data: { devMode: true } };
            }
        });

        await expect(transport.sendToBackground(message)).resolves.toEqual({
            success: true,
            data: { devMode: true },
        });
        await expect(transport.sendToPage(1, message)).resolves.toEqual({
            success: true,
            data: { devMode: true },
        });
    });

    it('unsubscribes listeners', async () => {
        const transport = new EmbedTransportService();
        const unsubscribe = transport.addMessageListener(() => ({ success: true }));

        unsubscribe();

        await expect(transport.sendToBackground({ type: 'GET_SETTINGS' })).rejects.toThrow(
            'Message handler is not registered',
        );
    });

    it('throws when no handler responds', async () => {
        const transport = new EmbedTransportService();
        transport.addMessageListener(() => undefined);

        await expect(transport.sendToBackground({ type: 'GET_SETTINGS' })).rejects.toThrow(
            'Message handler did not return a response',
        );
    });
});
