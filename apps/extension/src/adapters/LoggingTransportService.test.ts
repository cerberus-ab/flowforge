import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransportService } from './TransportService';
import { LoggingTransportService } from './LoggingTransportService';

describe('LoggingTransportService', () => {
    const message = { type: 'GET_SETTINGS' } as const;
    const context = { pageId: 7 };
    let transport: TransportService;

    beforeEach(() => {
        transport = {
            getActivePageContext: vi.fn(async () => context),
            getPageUrl: vi.fn(async () => 'https://example.com'),
            sendToBackground: vi.fn(async () => ({ success: true })),
            sendToPage: vi.fn(async () => ({ success: true })),
            addMessageListener: vi.fn(() => () => undefined),
        } as unknown as TransportService;
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    it('logs outgoing messages and responses while returning the transport response', async () => {
        const logger = new LoggingTransportService(transport);

        await expect(logger.sendToBackground(message, context)).resolves.toEqual({ success: true });

        expect(console.log).toHaveBeenCalledTimes(2);
        expect(console.log).toHaveBeenNthCalledWith(1, '[FlowForge transport] sent to background: GET_SETTINGS', {
            context,
            message,
            details: undefined,
        });
    });

    it('preserves an unhandled incoming message as undefined', () => {
        let wrappedListener:
            ((...args: Parameters<Parameters<TransportService['addMessageListener']>[0]>) => unknown) | undefined;
        vi.mocked(transport.addMessageListener).mockImplementation((handler) => {
            wrappedListener = handler;
            return () => undefined;
        });
        const logger = new LoggingTransportService(transport);
        logger.addMessageListener(() => undefined);

        expect(wrappedListener?.(message, context)).toBeUndefined();
        expect(console.log).toHaveBeenCalledWith('[FlowForge transport] received: GET_SETTINGS', {
            context,
            message,
            details: undefined,
        });
    });
});
