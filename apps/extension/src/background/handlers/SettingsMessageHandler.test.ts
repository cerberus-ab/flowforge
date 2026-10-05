import { describe, expect, it } from 'vitest';

import { FakeLocalStorage } from '../../../test/unit/fakes/FakeLocalStorage';
import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import type { ExtensionSettings, UpdateSettingsMessage } from '@/types';
import { SettingsMessageHandler } from './SettingsMessageHandler';

const defaultSettings: ExtensionSettings = { theme: 'light', devMode: false };

describe('SettingsMessageHandler', () => {
    it('returns stored settings', async () => {
        // Given
        const { handler } = createHandler();

        // When
        const response = await handler.handle({ type: 'GET_SETTINGS' });

        // Then
        expect(response).toEqual({ success: true, data: defaultSettings });
    });

    it('updates settings and broadcasts the change to the sender page', async () => {
        // Given
        const { handler, transport } = createHandler();
        const message: UpdateSettingsMessage = {
            type: 'UPDATE_SETTINGS',
            senderId: 7,
            data: { patch: { theme: 'dark' } },
        };

        // When
        const response = await handler.handle(message);

        // Then
        expect(response).toEqual({ success: true, data: { ...defaultSettings, theme: 'dark' } });
        expect(transport.getSentToPage()).toEqual([
            {
                senderId: 7,
                message: {
                    type: 'SETTINGS_UPDATED',
                    data: { ...defaultSettings, theme: 'dark' },
                },
            },
        ]);
    });

    it('updates settings without broadcasting when there is no sender', async () => {
        // Given
        const { handler, transport } = createHandler();

        // When
        const response = await handler.handle({
            type: 'UPDATE_SETTINGS',
            data: { patch: { devMode: true } },
        } as UpdateSettingsMessage);

        // Then
        expect(response).toEqual({ success: true, data: { theme: 'light', devMode: true } });
        expect(transport.getSentToPage()).toEqual([]);
    });
});

function createHandler() {
    const transport = new FakeTransportService();
    const settingsStorage = new SettingsStorage(new FakeLocalStorage(), defaultSettings);
    const handler = new SettingsMessageHandler(transport, settingsStorage);

    return { handler, transport };
}
