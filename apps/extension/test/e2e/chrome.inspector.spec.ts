import { expect, extensionPaths, openExtensionPopup, test } from './fixtures/chromeExtension';

test.use({ extensionPath: extensionPaths.inspector });

test('injects the inspector content script and opens its popup', async ({ context, extensionId, page }) => {
    // Given / When
    await page.goto('/chrome');
    const pageRoot = page.getByTestId('flowforge-inspector-page-root');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // Then
    await expect(pageRoot).toBeAttached();
    await expect(pageRoot).toHaveAttribute('id', 'flowforge-extension-inspector-page-root');
    await expect.poll(() => pageRoot.evaluate((root) => Boolean(root.shadowRoot))).toBe(true);
    await expect(page.getByTestId('flowforge-inspector-page')).toBeAttached();
    await expect(popup.locator('#flowforge-extension-inspector-popup-root')).toHaveAttribute(
        'id',
        'flowforge-extension-inspector-popup-root',
    );
    await expect(popup.getByTestId('flowforge-inspector-popup')).toBeVisible();
    await expect(popup.getByTestId('flowforge-ip-opener-submit')).toBeVisible();

    await popup.close();
});

test('opens and clears the page inspector from the inspector popup', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // When
    await popup.getByTestId('flowforge-ip-opener-submit').click();

    // Then
    await expect(page.getByTestId('flowforge-inspector')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector-tab-basics')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('flowforge-inspector-panel')).toContainText('Chrome Extension Sandbox');

    // When
    const nextPopup = await openExtensionPopup(context, extensionId, { activePage: page });

    // Then
    await expect(nextPopup.getByTestId('flowforge-inspector-popup')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector')).toHaveCount(0);

    await nextPopup.close();
});
