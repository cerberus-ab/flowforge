import { expect, openExtensionPopup, test } from './fixtures/chromeExtension';
import { createQueryResponseFixture } from '../fixtures';
import { mockQuery } from './fakes/mockQuery';
import { expectHighlightToCoverTarget } from './utils';

const directTarget = {
    dataId: 'ff10000011',
    text: 'Open Chrome extension docs',
};

const wizardSteps = [
    { dataId: 'ff10000001', text: 'Open account settings' },
    { dataId: 'ff10000002', text: 'Review project status' },
    { dataId: 'ff10000003', text: 'Invite a teammate' },
];

test('injects the Chrome content script into the sandbox page', async ({ page }) => {
    // Given/When
    await page.goto('/chrome');
    const pageRoot = page.getByTestId('flowforge-chrome-page-root');

    // Then
    await expect(pageRoot).toBeAttached();
    await expect.poll(() => pageRoot.evaluate((root) => Boolean(root.shadowRoot))).toBe(true);
    await expect(page.getByTestId('flowforge-page')).toBeAttached();
});

test('opens the Chrome extension popup page', async ({ context, extensionId }) => {
    // Given/When
    const popup = await openExtensionPopup(context, extensionId);

    // Then
    await expect(popup.getByTestId('flowforge-popup')).toBeVisible();
    await expect(popup.getByTestId('flowforge-question-input')).toBeVisible();
    await expect(popup.getByTestId('flowforge-question-submit')).toBeVisible();

    await popup.close();
});

test('answers a question through the configured backend', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    await mockQuery(
        context,
        createQueryResponseFixture({
            result: {
                answer: 'Chrome backend response',
                elements: [],
                mode: 'direct',
                topic: null,
            },
        }),
    );
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // When
    await popup.getByTestId('flowforge-question-input').fill('What is this page about?');
    await popup.getByTestId('flowforge-question-submit').click();

    // Then
    await expect(popup.getByTestId('flowforge-result')).toContainText('Chrome backend response');

    await popup.close();
});

test('highlights a direct result element from the popup', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    await mockQuery(
        context,
        createQueryResponseFixture({
            result: {
                answer: 'Chrome backend response',
                elements: [
                    {
                        text: directTarget.text,
                        dataId: directTarget.dataId,
                        action: 'navigate',
                    },
                ],
                mode: 'direct',
                topic: null,
            },
        }),
    );
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // When
    await popup.getByTestId('flowforge-question-input').fill('Where are the Chrome docs?');
    await popup.getByTestId('flowforge-question-submit').click();
    await popup.getByTestId(`flowforge-result-element-${directTarget.dataId}`).click();

    // Then
    await expect(page.getByTestId('flowforge-highlight-label')).toContainText(directTarget.text);
    await expectHighlightToCoverTarget(
        page.getByTestId('flowforge-highlight'),
        page.locator(`[data-flowforge-id="${directTarget.dataId}"]`),
    );

    await popup.close();
});

test('opens the page inspector from the popup', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // When
    await popup.getByTestId('flowforge-open-inspector').click();

    // Then
    await expect(page.getByTestId('flowforge-inspector')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector-tab-basics')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector-tab-interactive')).toBeVisible();

    await popup.close();
});

test('opens the Markdown inspector tab from the popup', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // When
    await popup.getByTestId('flowforge-open-markdown-inspector').click();

    // Then
    await expect(page.getByTestId('flowforge-inspector')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector-tab-markdown')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('flowforge-markdown-viewer')).toContainText('Explore Chrome Extension');

    await popup.close();
});

test('clears page state when the popup opens', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    const firstPopup = await openExtensionPopup(context, extensionId, { activePage: page });
    await firstPopup.getByTestId('flowforge-open-inspector').click();
    await firstPopup.close();
    await expect(page.getByTestId('flowforge-inspector')).toBeVisible();

    // When
    const secondPopup = await openExtensionPopup(context, extensionId, { activePage: page });

    // Then
    await expect(secondPopup.getByTestId('flowforge-popup')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector')).toHaveCount(0);

    await secondPopup.close();
});

test('runs wizard onboarding through the configured backend', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    await mockQuery(
        context,
        createQueryResponseFixture({
            result: {
                answer: 'Follow the Chrome sandbox controls.',
                elements: wizardSteps.map((step) => ({
                    text: step.text,
                    dataId: step.dataId,
                    action: 'click',
                })),
                mode: 'steps',
                topic: 'Chrome Sandbox',
            },
        }),
    );
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    // When
    await popup.getByTestId('flowforge-question-input').fill('How do I use the Chrome sandbox?');
    await popup.getByTestId('flowforge-question-submit').click();

    // Then
    await expect(popup.getByTestId('flowforge-result')).toContainText('Follow the Chrome sandbox controls.');
    await expect(page.getByTestId('flowforge-wizard')).toBeVisible();

    await page.getByTestId('flowforge-wizard-start').click();
    await expect(page.getByTestId('flowforge-wizard-status')).toContainText('Step 1 of 3');
    await expect(page.getByTestId('flowforge-highlight-label')).toContainText(wizardSteps[0]!.text);
    await expectHighlightToCoverTarget(
        page.getByTestId('flowforge-highlight'),
        page.locator(`[data-flowforge-id="${wizardSteps[0]!.dataId}"]`),
    );
    await expect(page.getByTestId('flowforge-wizard-prev')).toBeDisabled();

    for (const [index, step] of wizardSteps.slice(1).entries()) {
        await page.getByTestId('flowforge-wizard-next').click();

        await expect(page.getByTestId('flowforge-wizard-status')).toContainText(`Step ${index + 2} of 3`);
        await expect(page.getByTestId('flowforge-highlight-label')).toContainText(step.text);
        await expectHighlightToCoverTarget(
            page.getByTestId('flowforge-highlight'),
            page.locator(`[data-flowforge-id="${step.dataId}"]`),
        );
    }

    await expect(page.getByTestId('flowforge-wizard-next')).toBeDisabled();
    await page.getByTestId('flowforge-wizard-finish').click();

    await expect(page.getByTestId('flowforge-wizard')).toHaveCount(0);
    await expect(page.getByTestId('flowforge-highlight')).toHaveCount(0);

    await popup.close();
});
