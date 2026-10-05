import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExtensionSettings, UpdateSettingsMessage } from '@/types';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { FakeLocalStorage } from '../../../../test/unit/fakes/FakeLocalStorage';
import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { InspectorBackgroundWorker } from './InspectorBackgroundWorker';

const defaultSettings: ExtensionSettings = { theme: 'light', devMode: false };

function createWorker() {
    const transport = new FakeTransportService();
    const settingsStorage = new SettingsStorage(new FakeLocalStorage(), defaultSettings);
    const worker = new InspectorBackgroundWorker(transport, settingsStorage);
    return { transport, worker };
}

describe('InspectorBackgroundWorker', () => {
    beforeEach(() => {
        vi.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    it('registers and unregisters its message listener', async () => {
        // Given
        const { transport, worker } = createWorker();

        // When
        worker.start();

        // Then
        await expect(transport.dispatchToBackground({ type: 'GET_SETTINGS' })).resolves.toEqual({
            success: true,
            data: defaultSettings,
        });

        // When
        worker.stop();

        // Then
        await expect(transport.dispatchToBackground({ type: 'GET_SETTINGS' })).rejects.toThrow(
            'Message handler is not registered',
        );
    });

    it('clears the page when the popup initializes', async () => {
        // Given
        const { transport, worker } = createWorker();
        worker.start();

        // When
        await expect(transport.dispatchToBackground({ type: 'POPUP_INITIALISE', senderId: 7 })).resolves.toEqual({
            success: true,
        });

        // Then
        expect(transport.getSentToPage()).toEqual([{ senderId: 7, message: { type: 'CLEAR_PAGE' } }]);
        worker.stop();
    });

    it('returns settings and broadcasts sender updates', async () => {
        // Given
        const { transport, worker } = createWorker();
        worker.start();

        // When
        const initial = await transport.dispatchToBackground({ type: 'GET_SETTINGS' });
        const updated = await transport.dispatchToBackground({
            type: 'UPDATE_SETTINGS',
            senderId: 7,
            data: { patch: { theme: 'dark' } },
        } satisfies UpdateSettingsMessage);

        // Then
        expect(initial).toEqual({ success: true, data: defaultSettings });
        expect(updated).toEqual({ success: true, data: { theme: 'dark', devMode: false } });
        expect(transport.getSentToPage()).toEqual([
            {
                senderId: 7,
                message: { type: 'SETTINGS_UPDATED', data: { theme: 'dark', devMode: false } },
            },
        ]);
        worker.stop();
    });

    it('updates settings without a page broadcast when there is no sender', async () => {
        // Given
        const { transport, worker } = createWorker();
        worker.start();

        // When
        await expect(
            transport.dispatchToBackground({ type: 'UPDATE_SETTINGS', data: { patch: { devMode: true } } }),
        ).resolves.toEqual({ success: true, data: { theme: 'light', devMode: true } });

        // Then
        expect(transport.getSentToPage()).toEqual([]);
        worker.stop();
    });

    it('clears the page before opening the requested inspector tab', async () => {
        // Given
        const { transport, worker } = createWorker();
        worker.start();

        // When
        await expect(
            transport.dispatchToBackground({
                type: 'OPEN_PAGE_INSPECTOR',
                senderId: 7,
                data: { tab: 'semantic' },
            }),
        ).resolves.toEqual({ success: true });

        // Then
        expect(transport.getSentToPage()).toEqual([
            { senderId: 7, message: { type: 'CLEAR_PAGE' } },
            { senderId: 7, message: { type: 'OPEN_INSPECTOR', data: { tab: 'semantic' } } },
        ]);
        worker.stop();
    });

    it('does not open the inspector if clearing the page fails', async () => {
        // Given
        const { transport, worker } = createWorker();
        const error = new Error('Page unavailable');
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
        vi.spyOn(transport, 'sendToPage').mockRejectedValue(error);
        worker.start();

        // When / Then
        await expect(
            transport.dispatchToBackground({ type: 'OPEN_PAGE_INSPECTOR', senderId: 7, data: {} }),
        ).rejects.toThrow('Page unavailable');
        expect(transport.sendToPage).toHaveBeenCalledTimes(1);
        expect(transport.sendToPage).toHaveBeenCalledWith(7, { type: 'CLEAR_PAGE' });
        worker.stop();
    });
});
