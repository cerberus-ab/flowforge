import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import type { TransportService } from '@/adapters/interface';
import { config } from '@/config';
import type { ExtensionSettings, Message, MessageResponse } from '@/types';
import { FakeTransportService } from '../../../test/unit/fakes/FakeTransportService';
import { createSettingsFixture } from '../../../test/fixtures.ts';
import { useSettings } from './useSettings';

const initialSettings = createSettingsFixture();
const darkThemeSettings = createSettingsFixture({ theme: 'dark' });
const devModeSettings = createSettingsFixture({ devMode: true });

type TestMessageResponse = MessageResponse | MessageResponse<ExtensionSettings>;

function SettingsHarness({ transport }: { transport: TransportService }) {
    const settings = useSettings({ transport });

    if (settings.status === 'loading') {
        return <div data-testid="status">loading</div>;
    }
    return (
        <section>
            <div data-testid="status">{settings.status}</div>
            <div data-testid="theme">{settings.theme}</div>
            <div data-testid="dev-mode">{String(settings.devMode)}</div>
            <button type="button" onClick={() => void settings.toggleTheme()}>
                Toggle Theme
            </button>
            <button type="button" onClick={() => void settings.setDevMode(true)}>
                Enable Dev Mode
            </button>
        </section>
    );
}

function renderSettings({
    handler,
}: {
    handler?: (message: Message) => Promise<TestMessageResponse> | TestMessageResponse | undefined;
} = {}) {
    const transport = new FakeTransportService({ activeSenderId: 42 });
    const messages: Message[] = [];

    transport.addMessageListener((message) => {
        messages.push(message);
        if (handler) return handler(message);
        if (message.type === 'GET_SETTINGS') {
            return {
                success: true,
                data: initialSettings,
            };
        }
        return undefined;
    });

    render(<SettingsHarness transport={transport} />);

    return { messages, transport };
}

async function expectReadySettings(settings: ExtensionSettings) {
    await waitFor(() => {
        expect(screen.getByTestId('status').textContent).toBe('ready');
        expect(screen.getByTestId('theme').textContent).toBe(settings.theme);
        expect(screen.getByTestId('dev-mode').textContent).toBe(String(settings.devMode));
    });
}

describe('useSettings', () => {
    it('loads settings from the background on mount', async () => {
        // Given / When
        const { messages } = renderSettings();

        // Then
        expect(screen.getByTestId('status').textContent).toBe('loading');
        await expectReadySettings(initialSettings);
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'GET_SETTINGS',
                }),
            ]),
        );
    });

    it('falls back to default settings when loading fails', async () => {
        // Given / When
        renderSettings({
            handler: (message) => {
                if (message.type === 'GET_SETTINGS') {
                    return {
                        success: false,
                        error: 'Settings unavailable',
                    };
                }
                return undefined;
            },
        });

        // Then
        await expectReadySettings(config.defaultSettings);
    });

    it('updates settings through UPDATE_SETTINGS', async () => {
        // Given
        const { messages } = renderSettings({
            handler: (message) => {
                if (message.type === 'GET_SETTINGS') {
                    return {
                        success: true,
                        data: initialSettings,
                    };
                }
                if (message.type === 'UPDATE_SETTINGS') {
                    return {
                        success: true,
                        data: darkThemeSettings,
                    };
                }
                return undefined;
            },
        });
        await expectReadySettings(initialSettings);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Toggle Theme' }));

        // Then
        await expectReadySettings(darkThemeSettings);
        expect(messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    type: 'UPDATE_SETTINGS',
                    senderId: 42,
                    data: {
                        patch: {
                            theme: 'dark',
                        },
                    },
                }),
            ]),
        );
    });

    it('keeps current settings when an update fails', async () => {
        // Given
        renderSettings({
            handler: (message) => {
                if (message.type === 'GET_SETTINGS') {
                    return {
                        success: true,
                        data: initialSettings,
                    };
                }
                if (message.type === 'UPDATE_SETTINGS') {
                    return {
                        success: false,
                        error: 'Update failed',
                    };
                }
                return undefined;
            },
        });
        await expectReadySettings(initialSettings);

        // When
        fireEvent.click(screen.getByRole('button', { name: 'Enable Dev Mode' }));

        // Then
        await expectReadySettings(initialSettings);
    });

    it('applies incoming SETTINGS_UPDATED messages', async () => {
        // Given
        const { transport } = renderSettings();
        await expectReadySettings(initialSettings);

        // When
        await transport.dispatchToBackground({
            type: 'SETTINGS_UPDATED',
            data: devModeSettings,
        });

        // Then
        await expectReadySettings(devModeSettings);
    });
});
