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
            sendToPopup: vi.fn(async () => ({ success: true })),
            addMessageListener: vi.fn(() => () => undefined),
        } as unknown as TransportService;
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    it('logs outgoing messages and their full responses', async () => {
        // Given
        const response = { success: true as const, data: { theme: 'dark' } };
        vi.mocked(transport.sendToBackground).mockResolvedValue(response);
        const logger = new LoggingTransportService(transport);

        // When
        await expect(logger.sendToBackground(message, context)).resolves.toBe(response);

        // Then
        expect(console.log).toHaveBeenCalledTimes(2);
        expect(console.log).toHaveBeenNthCalledWith(1, '[FlowForge transport] sent to background: GET_SETTINGS', {
            context,
            message,
        });
        expect(console.log).toHaveBeenNthCalledWith(2, '[FlowForge transport] response from background: GET_SETTINGS', {
            context,
            response,
        });
    });

    it('logs failure responses without treating them as rejected sends', async () => {
        // Given
        const response = { success: false as const, error: 'Page unavailable' };
        vi.mocked(transport.sendToPage).mockResolvedValue(response);
        const logger = new LoggingTransportService(transport);
        const pageMessage = { type: 'CLEAR_PAGE' } as const;

        // When
        await expect(logger.sendToPage(7, pageMessage)).resolves.toBe(response);

        // Then
        expect(console.log).toHaveBeenLastCalledWith('[FlowForge transport] response from page: CLEAR_PAGE', {
            context,
            response,
        });
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('logs rejected sends and preserves the original error', async () => {
        // Given
        const error = new Error('Popup unavailable');
        vi.mocked(transport.sendToPopup).mockRejectedValue(error);
        const logger = new LoggingTransportService(transport);
        const popupMessage = { type: 'QUERY_FINISHED', data: { queryId: 'query-1' } } as const;

        // When
        await expect(logger.sendToPopup(popupMessage, context)).rejects.toBe(error);

        // Then
        expect(console.warn).toHaveBeenCalledWith('[FlowForge transport] failed to send to popup: QUERY_FINISHED', {
            context,
            error,
        });
    });

    it('does not log an unhandled incoming message', () => {
        let wrappedListener:
            ((...args: Parameters<Parameters<TransportService['addMessageListener']>[0]>) => unknown) | undefined;
        vi.mocked(transport.addMessageListener).mockImplementation((handler) => {
            wrappedListener = handler;
            return () => undefined;
        });
        const logger = new LoggingTransportService(transport);
        logger.addMessageListener(() => undefined);

        expect(wrappedListener?.(message, context)).toBeUndefined();
        expect(console.log).not.toHaveBeenCalled();
    });

    it('logs a handled incoming message', () => {
        let wrappedListener:
            ((...args: Parameters<Parameters<TransportService['addMessageListener']>[0]>) => unknown) | undefined;
        vi.mocked(transport.addMessageListener).mockImplementation((handler) => {
            wrappedListener = handler;
            return () => undefined;
        });
        const logger = new LoggingTransportService(transport);
        const response = Promise.resolve({ success: true as const });
        logger.addMessageListener(() => response);

        expect(wrappedListener?.(message, context)).toBe(response);
        expect(console.log).toHaveBeenCalledWith('[FlowForge transport] received: GET_SETTINGS', {
            context,
            message,
        });
    });
});
