import { chromium, expect, test as base, type BrowserContext, type Page } from '@playwright/test';

const extensionPath = new URL('../../../dist/chrome', import.meta.url).pathname;

export const test = base.extend<{ context: BrowserContext; extensionId: string; page: Page }>({
    context: async ({ baseURL }, use, testInfo) => {
        const context = await chromium.launchPersistentContext(testInfo.outputPath('chrome-user-data'), {
            baseURL,
            channel: 'chromium',
            args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
        });
        if (!context.serviceWorkers().length) {
            await context.waitForEvent('serviceworker');
        }
        try {
            await use(context);
        } finally {
            await context.close();
        }
    },

    extensionId: async ({ context }, use) => {
        const serviceWorker = await getExtensionServiceWorker(context);
        const extensionId = new URL(serviceWorker.url()).host;

        await use(extensionId);
    },

    page: async ({ context }, use) => {
        const page = await context.newPage();
        try {
            await use(page);
        } finally {
            await page.close();
        }
    },
});

export { expect };

interface OpenExtensionPopupOptions {
    activePage?: Page;
}

export async function openExtensionPopup(
    context: BrowserContext,
    extensionId: string,
    options: OpenExtensionPopupOptions = {},
): Promise<Page> {
    const popup = await context.newPage();

    if (options.activePage) {
        await mockActiveTabQuery(context, popup, options.activePage);
    }

    await popup.goto(`chrome-extension://${extensionId}/action/popup/index.html`);

    return popup;
}

async function getExtensionServiceWorker(context: BrowserContext) {
    return context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
}

async function mockActiveTabQuery(context: BrowserContext, popup: Page, activePage: Page): Promise<void> {
    const tabId = await getChromeTabId(context, activePage);

    await popup.addInitScript({
        content: `
            {
                // Direct popup URLs run as tabs in Playwright; keep activeTab pointing at the sandbox page.
                const activeTab = { id: ${tabId} };
                const patch = () => {
                    if (!globalThis.chrome?.tabs?.query) {
                        setTimeout(patch, 0);
                        return;
                    }
                    const originalQuery = globalThis.chrome.tabs.query.bind(globalThis.chrome.tabs);
                    globalThis.chrome.tabs.query = (queryInfo, callback) => {
                        const isActiveTabQuery = queryInfo?.active === true && queryInfo?.currentWindow === true;
                        const result = isActiveTabQuery ? Promise.resolve([activeTab]) : originalQuery(queryInfo);
                        if (typeof callback === 'function') {
                            result.then(callback);
                            return;
                        }
                        return result;
                    };
                };
                patch();
            }
        `,
    });
}

async function getChromeTabId(context: BrowserContext, page: Page): Promise<number> {
    const serviceWorker = await getExtensionServiceWorker(context);
    const tabId = await serviceWorker.evaluate(async (url) => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find((item) => item.url === url);

        return tab?.id ?? null;
    }, page.url());

    if (tabId === null) {
        throw new Error(`Chrome tab not found for page: ${page.url()}`);
    }

    return tabId;
}
