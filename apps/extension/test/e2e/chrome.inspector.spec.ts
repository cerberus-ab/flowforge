import { expect, extensionPaths, openExtensionPopup, test } from './fixtures/chromeExtension';

test.use({ extensionPath: extensionPaths.inspector });

test('loads the Inspector popup without mounting an overlay in the page', async ({ context, extensionId, page }) => {
    // Given / When
    await page.goto('/chrome');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // Then
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

    // Then
    await expect(page.getByTestId('flowforge-inspector')).toHaveCount(0);
    const panel = await context.newPage();
    await panel.goto(`chrome-extension://${extensionId}/${sidePanelPath.path}`);
    await expect(panel.getByTestId('flowforge-inspector')).toBeVisible();
    await expect(panel.getByTestId('flowforge-inspector-tab-basics')).toHaveAttribute('aria-selected', 'true');
    await expect(panel.getByTestId('flowforge-inspector-panel')).toContainText('Chrome Extension Sandbox');

    await panel.close();
});
