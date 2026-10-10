import { describe, expect, it, vi } from 'vitest';

import { ChromeTransportService } from '@/adapters';

type ChromeMessageListener = typeof chrome.runtime.onMessage.addListener extends (listener: infer T) => void
    ? T
    : never;

type ChromeOverrides = {
    runtime?: Record<string, unknown>;
    tabs?: Record<string, unknown>;
};

describe('ChromeTransportService', () => {
    it('resolves the active page context', async () => {
        const chromeApi = stubChrome({
            tabs: {
                query: vi.fn().mockResolvedValue([{ id: 42 }]),
            },
        });
        const transport = new ChromeTransportService();

        await expect(transport.getActivePageContext()).resolves.toEqual({ pageId: 42 });
        expect(chromeApi.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    });

    it('returns an empty context when active tab id is unavailable', async () => {
        stubChrome({
            tabs: {
                query: vi.fn().mockResolvedValue([{}]),
            },
        });
        const transport = new ChromeTransportService();

        await expect(transport.getActivePageContext()).resolves.toEqual({});
    });

    it('resolves the sender hostname from the tab URL', async () => {
        const chromeApi = stubChrome({
            tabs: {
                get: vi.fn().mockResolvedValue({ url: 'https://app.flowforge.test/path' }),
            },
        });
        const transport = new ChromeTransportService();

        await expect(transport.getPageHostname(42)).resolves.toBe('app.flowforge.test');
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
        const backgroundMessage = { type: 'GET_SETTINGS' } as const;
        const pageMessage = { type: 'CLEAR_PAGE' } as const;

        await expect(transport.sendToBackground(backgroundMessage, { pageId: 42 })).resolves.toEqual({ success: true });
        await expect(transport.sendToPage(42, pageMessage)).resolves.toEqual({ success: true });
        expect(chromeApi.runtime.sendMessage).toHaveBeenCalledWith({
            message: backgroundMessage,
            context: { pageId: 42 },
        });
        expect(chromeApi.tabs.sendMessage).toHaveBeenCalledWith(42, {
            message: pageMessage,
            context: { pageId: 42 },
        });
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
        const handler = vi.fn(() => ({ success: true }) as const);
        const unsubscribe = transport.addMessageListener(handler);
        const sendResponse = vi.fn();
        const [listener] = [...listeners];

        expect(
            listener?.(
                { message: { type: 'GET_SETTINGS' }, context: { pageId: 7 } },
                { url: 'https://app.flowforge.test/', tab: { id: 42 } } as chrome.runtime.MessageSender,
                sendResponse,
            ),
        ).toBe(true);
        expect(handler).toHaveBeenCalledWith({ type: 'GET_SETTINGS' }, { pageId: 42 });
        unsubscribe();

        expect(sendResponse).not.toHaveBeenCalled();
        expect(chromeApi.runtime.onMessage.removeListener).toHaveBeenCalledWith(listener);
        expect(listeners.size).toBe(0);
    });

    it('preserves the explicit page context for extension-page senders', () => {
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
        const handler = vi.fn(() => ({ success: true }) as const);
        transport.addMessageListener(handler);
        const [listener] = [...listeners];

        listener?.(
            { message: { type: 'GET_SETTINGS' }, context: { pageId: 7 } },
            {
                url: chrome.runtime.getURL('/action/popup/index.html'),
                tab: { id: 42 },
            } as chrome.runtime.MessageSender,
            vi.fn(),
        );

        expect(handler).toHaveBeenCalledWith({ type: 'GET_SETTINGS' }, { pageId: 7 });
    });

    it('sends successful asynchronous listener responses to Chrome', async () => {
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
        const response = { success: true as const, data: { theme: 'light' } };
        transport.addMessageListener(async () => response);
        const sendResponse = vi.fn();
        const [listener] = [...listeners];

        expect(listener?.({ message: { type: 'GET_SETTINGS' }, context: {} }, {}, sendResponse)).toBe(true);
        await Promise.resolve();
        await Promise.resolve();

        expect(sendResponse).toHaveBeenCalledWith(response);
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

        expect(listener?.({ message: { type: 'GET_SETTINGS' }, context: {} }, {}, sendResponse)).toBe(true);
        await Promise.resolve();
        await Promise.resolve();

        expect(sendResponse).toHaveBeenCalledWith({ success: false, error: 'failed' });
    });
});

function stubChrome(overrides: ChromeOverrides) {
    const chromeApi = {
        runtime: {
            getURL: (path: string) => `chrome-extension://test-extension${path}`,
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
