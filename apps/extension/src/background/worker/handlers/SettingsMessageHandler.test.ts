import { describe, expect, it } from 'vitest';

import { FakeLocalStorage } from '../../../../test/unit/fakes/FakeLocalStorage';
import { FakeTransportService } from '../../../../test/unit/fakes/FakeTransportService';
import { SettingsStorage } from '@/core/services/SettingsStorage';
import { PageClient } from '@/page/client/PageClient';
import type { UpdateSettingsMessage } from '@/messaging';
import type { ExtensionSettings } from '@/types';
import { SettingsMessageHandler } from './SettingsMessageHandler';

const defaultSettings: ExtensionSettings = { theme: 'light', devMode: false };

describe('SettingsMessageHandler', () => {
    it('returns stored settings', async () => {
        // Given
        const { handler } = createHandler();

        // When
        const response = await handler.handleGetSettings();

        // Then
        expect(response).toEqual(defaultSettings);
    });

    it('updates settings and broadcasts the change to the sender page', async () => {
        // Given
        const { handler, transport } = createHandler();
        const message: UpdateSettingsMessage = {
            type: 'UPDATE_SETTINGS',
            pageId: 7,
            data: { patch: { theme: 'dark' } },
        };

        // When
        const response = await handler.handleUpdateSettings(message);

        // Then
        expect(response).toEqual({ ...defaultSettings, theme: 'dark' });
        expect(transport.getSentToPage()).toEqual([
            {
                pageId: 7,
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
        const response = await handler.handleUpdateSettings({
            type: 'UPDATE_SETTINGS',
            data: { patch: { devMode: true } },
        } as UpdateSettingsMessage);

        // Then
        expect(response).toEqual({ theme: 'light', devMode: true });
        expect(transport.getSentToPage()).toEqual([]);
    });
});

function createHandler() {
    const transport = new FakeTransportService();
    const settingsStorage = new SettingsStorage(new FakeLocalStorage(), defaultSettings);
    const handler = new SettingsMessageHandler(new PageClient(transport), settingsStorage);

    return { handler, transport };
}
