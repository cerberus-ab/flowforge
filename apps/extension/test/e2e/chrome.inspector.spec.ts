import { expect, extensionPaths, openExtensionPopup, test } from './fixtures/chromeExtension';

test.use({ extensionPath: extensionPaths.inspector });

test('loads the Inspector popup without mounting an overlay in the page', async ({ context, extensionId, page }) => {
    // Given / When
    await page.goto('/chrome');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // Then
    expect(await popup.evaluate(() => chrome.runtime.getManifest().side_panel)).toBeUndefined();
    await expect(page.getByTestId('flowforge-inspector-page-root')).toHaveCount(0);
    await expect(popup.locator('#flowforge-extension-inspector-popup-root')).toHaveAttribute(
        'id',
        'flowforge-extension-inspector-popup-root',
    );
    await expect(popup.getByTestId('flowforge-inspector-popup')).toBeVisible();
    await expect(popup.getByTestId('flowforge-ip-opener-submit')).toBeVisible();

    await popup.close();
});

test('opens a tab-specific side panel and collects page data there', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // When
    const openButton = popup.getByTestId('flowforge-ip-opener-submit');
    await expect(openButton).toBeEnabled();
    const sidePanelPath = await popup.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return chrome.sidePanel.getOptions({ tabId: tab!.id });
    });
    expect(sidePanelPath.path).toContain('sidePanel/index.html?pageId=');
    await openButton.click();
    await expect.poll(() => popup.isClosed()).toBe(true);
    const serviceWorker = context.serviceWorkers()[0]!;
    await expect
        .poll(() =>
            serviceWorker.evaluate(async () => {
                const contexts = await chrome.runtime.getContexts({ contextTypes: ['SIDE_PANEL'] });
                return contexts.map((item) => item.documentUrl);
            }),
        )
        .toContain(`chrome-extension://${extensionId}/${sidePanelPath.path}`);

    // Then
    await expect(page.getByTestId('flowforge-inspector')).toHaveCount(0);
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${sidePanelPath.path}`);
    await expect(panel.getByTestId('flowforge-inspector')).toBeVisible();
    await expect(panel.getByTestId('flowforge-inspector-tab-basics')).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByTestId('flowforge-inspector-panel')).toContainText('Chrome Extension Sandbox');

    // The panel stays bound to its original tab when another tab becomes active.
    const otherPage = await context.newPage();
    await otherPage.goto('/');
    await otherPage.bringToFront();
    await expect
        .poll(() => serviceWorker.evaluate(async () => (await chrome.tabs.query({ active: true }))[0]?.url))
        .toBe(otherPage.url());
    await panel.reload();
    await expect(panel.getByTestId('flowforge-inspector-panel')).toContainText('Chrome Extension Sandbox');
    await otherPage.close();

    // Narrow side panels keep navigation accessible and stack Markdown controls above its preview.
    await panel.setViewportSize({ width: 360, height: 800 });
    await panel.getByTestId('flowforge-inspector-tab-markdown').click();
    await expect(panel.getByTestId('flowforge-markdown-detail-level')).toBeVisible();
    const markdownLayout = await panel.locator('.flowforge-inspector-page-markdown').evaluate((element) => {
        const aside = element.querySelector('aside')!.getBoundingClientRect();
        const content = element.querySelector('.flowforge-inspector-page-markdown__content')!.getBoundingClientRect();
        return { asideBottom: aside.bottom, contentTop: content.top };
    });
    expect(markdownLayout.contentTop).toBeGreaterThanOrEqual(markdownLayout.asideBottom);

    // Navigation invalidates the old snapshot and collects from the same tab again.
    await page.goto('/');
    await expect(panel.getByTestId('flowforge-inspector-panel')).toContainText('FlowForge - Sandbox');

    // Reopening refreshes an existing panel even when the page did not navigate.
    await page.evaluate(() => {
        document.title = 'Updated Inspector Page';
    });
    const nextPopup = await openExtensionPopup(context, extensionId, { activePage: page });
    const nextOpenButton = nextPopup.getByTestId('flowforge-ip-opener-submit');
    await expect(nextOpenButton).toBeEnabled();
    await nextOpenButton.click();
    await expect.poll(() => nextPopup.isClosed()).toBe(true);
    await expect(panel.getByTestId('flowforge-inspector-panel')).toContainText('Updated Inspector Page');

    // Chrome owns closing the native panel; the Inspector does not need an in-page close action.
    const boundPageId = Number(new URLSearchParams(sidePanelPath.path!.split('?')[1]).get('pageId'));
    await serviceWorker.evaluate((pageId) => chrome.sidePanel.close({ tabId: pageId }), boundPageId);
    await expect
        .poll(() =>
            serviceWorker.evaluate(async () => {
                const contexts = await chrome.runtime.getContexts({ contextTypes: ['SIDE_PANEL'] });
                return contexts.map((item) => item.documentUrl);
            }),
        )
        .not.toContain(`chrome-extension://${extensionId}/${sidePanelPath.path}`);

    await panel.close();
});

test('restores the selected tab and Markdown settings when the side panel reloads', async ({
    context,
    extensionId,
    page,
}) => {
    // Given
    await page.goto('/chrome');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });
    const openButton = popup.getByTestId('flowforge-ip-opener-submit');
    await expect(openButton).toBeEnabled();
    const sidePanelPath = await popup.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return chrome.sidePanel.getOptions({ tabId: tab!.id });
    });
    await openButton.click();
    await expect.poll(() => popup.isClosed()).toBe(true);
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${sidePanelPath.path}`);
    await expect(panel.getByTestId('flowforge-inspector-tab-basics')).toHaveAttribute('aria-selected', 'true');

    // When
    await panel.getByTestId('flowforge-inspector-tab-markdown').click();
    const detailLevel = panel.getByTestId('flowforge-markdown-detail-level');
    const basicsBlock = panel.getByTestId('flowforge-markdown-block-basics');
    await detailLevel.selectOption('compact');
    await basicsBlock.click();
    await expect(detailLevel).toHaveValue('compact');
    await expect(basicsBlock).toHaveAttribute('aria-checked', 'false');
    await panel.reload();

    // Then
    await expect(panel.getByTestId('flowforge-inspector-tab-markdown')).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByTestId('flowforge-markdown-detail-level')).toHaveValue('compact');
    await expect(panel.getByTestId('flowforge-markdown-block-basics')).toHaveAttribute('aria-checked', 'false');
    await expect(panel.getByTestId('flowforge-markdown-viewer')).not.toContainText('## Basics');

    await panel.close();
});

test('shows an error when the tab does not allow a content script', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('chrome://extensions/');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });
    const openButton = popup.getByTestId('flowforge-ip-opener-submit');
    await expect(openButton).toBeEnabled();
    const sidePanelPath = await popup.evaluate(async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        return chrome.sidePanel.getOptions({ tabId: tab!.id });
    });

    // When
    await openButton.click();
    await expect.poll(() => popup.isClosed()).toBe(true);
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${sidePanelPath.path}`);

    // Then
    await expect(panel.getByRole('alert')).toContainText('Could not collect page data for this tab.');
    await expect(panel.getByTestId('flowforge-inspector')).toHaveCount(0);
    await panel.close();
});
