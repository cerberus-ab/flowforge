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
        const matchingOperation = vi.fn();
        const skippedHandler: BackgroundMessageHandler = {
            resolve: vi.fn(() => undefined),
        };
        const matchingHandler: BackgroundMessageHandler = {
            resolve: vi.fn(() => matchingOperation),
        };
        const trailingHandler: BackgroundMessageHandler = {
            resolve: vi.fn(() => () => {
                throw new Error('Must not run');
            }),
        };
        const worker = new BackgroundWorker(transport, [skippedHandler, matchingHandler, trailingHandler]);
        worker.start();

        // When
        const response = await transport.dispatchToBackground({ type: 'GET_SETTINGS' });

        // Then
        expect(response).toEqual({ success: true });
        expect(skippedHandler.resolve).toHaveBeenCalledOnce();
        expect(matchingHandler.resolve).toHaveBeenCalledOnce();
        expect(matchingOperation).toHaveBeenCalledOnce();
        expect(trailingHandler.resolve).not.toHaveBeenCalled();
    });

    it('unregisters its transport listener when stopped', async () => {
        // Given
        const transport = new FakeTransportService();
        const worker = new BackgroundWorker(transport, [{ resolve: () => () => undefined }]);
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
                resolve: () => () => {
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
                resolve: () => () => Promise.reject(new Error('Page unavailable')),
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
