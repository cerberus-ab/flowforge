import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FakeTransportService } from '../../test/unit/fakes/FakeTransportService';
import type { BackgroundMessageHandler } from './handlers/BackgroundMessageHandler';
import { BackgroundWorker } from './BackgroundWorker';

describe('BackgroundWorker', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('routes messages to the first matching handler', async () => {
        // Given
        const transport = new FakeTransportService();
        const skippedHandler: BackgroundMessageHandler = { handle: vi.fn(() => undefined) };
        const matchingHandler: BackgroundMessageHandler = {
            handle: vi.fn(() => ({ success: true as const })),
        };
        const trailingHandler: BackgroundMessageHandler = {
            handle: vi.fn(() => ({ success: false as const, error: 'Must not run' })),
        };
        const worker = new BackgroundWorker(transport, [skippedHandler, matchingHandler, trailingHandler]);
        worker.start();

        // When
        const response = await transport.dispatchToBackground({ type: 'GET_SETTINGS' });

        // Then
        expect(response).toEqual({ success: true });
        expect(skippedHandler.handle).toHaveBeenCalledOnce();
        expect(matchingHandler.handle).toHaveBeenCalledOnce();
        expect(trailingHandler.handle).not.toHaveBeenCalled();
    });

    it('unregisters its transport listener when stopped', async () => {
        // Given
        const transport = new FakeTransportService();
        const worker = new BackgroundWorker(transport, [{ handle: () => ({ success: true }) }]);
        worker.start();

        // When
        worker.stop();

        // Then
        await expect(transport.dispatchToBackground({ type: 'GET_SETTINGS' })).rejects.toThrow(
            'Message handler is not registered',
        );
    });

    it('converts a synchronous handler error to a failure response', async () => {
        // Given
        const transport = new FakeTransportService();
        const worker = new BackgroundWorker(transport, [
            {
                handle: () => {
                    throw new Error('Settings unavailable');
                },
            },
        ]);
        worker.start();

        // When
        const response = await transport.dispatchToBackground({ type: 'GET_SETTINGS' });

        // Then
        expect(response).toEqual({ success: false, error: 'Settings unavailable' });
        expect(console.error).toHaveBeenCalledWith(
            '[FlowForge] Background failed to handle GET_SETTINGS:',
            expect.any(Error),
        );
    });

    it('converts an asynchronous handler error to a failure response', async () => {
        // Given
        const transport = new FakeTransportService();
        const worker = new BackgroundWorker(transport, [
            {
                handle: () => Promise.reject(new Error('Page unavailable')),
            },
        ]);
        worker.start();

        // When
        const response = await transport.dispatchToBackground({ type: 'OPEN_PAGE_INSPECTOR' });

        // Then
        expect(response).toEqual({ success: false, error: 'Page unavailable' });
        expect(console.error).toHaveBeenCalledWith(
            '[FlowForge] Background failed to handle OPEN_PAGE_INSPECTOR:',
            expect.any(Error),
        );
    });
});
