import { describe, expect, it, vi } from 'vitest';

import { ChromeTransportService } from './ChromeTransportService';

type ChromeMessageListener = typeof chrome.runtime.onMessage.addListener extends (listener: infer T) => void
    ? T
    : never;

type ChromeOverrides = {
    runtime?: Record<string, unknown>;
    tabs?: Record<string, unknown>;
};

describe('ChromeTransportService', () => {
    it('resolves the active tab id', async () => {
        const chromeApi = stubChrome({
            tabs: {
                query: vi.fn().mockResolvedValue([{ id: 42 }]),
            },
        });
        const transport = new ChromeTransportService();

        await expect(transport.getActiveSenderId()).resolves.toBe(42);
        expect(chromeApi.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });

    it('throws when active tab id is unavailable', async () => {
        stubChrome({
            tabs: {
                query: vi.fn().mockResolvedValue([{}]),
            },
        });
        const transport = new ChromeTransportService();

        await expect(transport.getActiveSenderId()).rejects.toThrow('Active tab not found');
    });

    it('resolves the sender hostname from the tab URL', async () => {
        const chromeApi = stubChrome({
            tabs: {
                get: vi.fn().mockResolvedValue({ url: 'https://app.flowforge.test/path' }),
            },
        });
        const transport = new ChromeTransportService();

        await expect(transport.getSenderHostname(42)).resolves.toBe('app.flowforge.test');
        expect(chromeApi.tabs.get).toHaveBeenCalledWith(42);
    });

    it('sends messages through runtime and tabs APIs', async () => {
        const chromeApi = stubChrome({
            runtime: {
                sendMessage: vi.fn().mockResolvedValue({ success: true }),
            },
            tabs: {
                sendMessage: vi.fn().mockResolvedValue({ success: true }),
            },
        });
        const transport = new ChromeTransportService();
        const message = { type: 'CLEAR_PAGE' } as const;

        await expect(transport.sendToBackground(message)).resolves.toEqual({ success: true });
        await expect(transport.sendToPage(42, message)).resolves.toEqual({ success: true });
        expect(chromeApi.runtime.sendMessage).toHaveBeenCalledWith(message);
        expect(chromeApi.tabs.sendMessage).toHaveBeenCalledWith(42, message);
    });

    it('registers, invokes, and unsubscribes runtime listeners', () => {
        const listeners = new Set<ChromeMessageListener>();
        const chromeApi = stubChrome({
            runtime: {
                onMessage: {
                    addListener: vi.fn((listener) => {
                        listeners.add(listener);
                    }),
                    removeListener: vi.fn((listener) => {
                        listeners.delete(listener);
                    }),
                },
            },
        });
        const transport = new ChromeTransportService();
        const unsubscribe = transport.addMessageListener(() => ({ success: true }));
        const sendResponse = vi.fn();
        const [listener] = [...listeners];

        expect(listener?.({ type: 'GET_SETTINGS' }, {}, sendResponse)).toBe(true);
        unsubscribe();

        expect(sendResponse).not.toHaveBeenCalled();
        expect(chromeApi.runtime.onMessage.removeListener).toHaveBeenCalledWith(listener);
        expect(listeners.size).toBe(0);
    });

    it('converts async listener errors to error responses', async () => {
        const listeners = new Set<ChromeMessageListener>();
        stubChrome({
            runtime: {
                onMessage: {
                    addListener: vi.fn((listener) => {
                        listeners.add(listener);
                    }),
                },
            },
        });
        const transport = new ChromeTransportService();
        transport.addMessageListener(async () => {
            throw new Error('failed');
        });
        const sendResponse = vi.fn();
        const [listener] = [...listeners];

        expect(listener?.({ type: 'GET_SETTINGS' }, {}, sendResponse)).toBe(true);
        await Promise.resolve();
        await Promise.resolve();

        expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'failed' });
    });
});

function stubChrome(overrides: ChromeOverrides) {
    const chromeApi = {
        runtime: {
            sendMessage: vi.fn(),
            onMessage: {
                addListener: vi.fn(),
                removeListener: vi.fn(),
            },
            ...overrides.runtime,
        },
        tabs: {
            query: vi.fn(),
            get: vi.fn(),
            sendMessage: vi.fn(),
            ...overrides.tabs,
        },
    };

    vi.stubGlobal('chrome', chromeApi as unknown as typeof chrome);
    return chromeApi;
}
