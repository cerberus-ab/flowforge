import { expect, extensionPaths, openExtensionPopup, test } from './fixtures/chromeExtension';
import { createQueryResponseFixture } from '../fixtures';
import { mockQuery } from './fakes/mockQuery';
import { expectHighlightToCoverTarget } from './utils';

test.use({ extensionPath: extensionPaths.assistant });

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
    const pageRoot = page.getByTestId('flowforge-page-root');

    // Then
    await expect(pageRoot).toBeAttached();
    await expect(pageRoot).toHaveAttribute('id', 'flowforge-extension-page-root');
    await expect.poll(() => pageRoot.evaluate((root) => Boolean(root.shadowRoot))).toBe(true);
    await expect(page.getByTestId('flowforge-page')).toBeAttached();
});

test('opens the Chrome extension popup page', async ({ context, extensionId }) => {
    // Given/When
    const popup = await openExtensionPopup(context, extensionId);

    // Then
    await expect(popup.locator('#flowforge-extension-popup-root')).toHaveAttribute(
        'id',
        'flowforge-extension-popup-root',
    );
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

    // The completed query survives closing and reopening the popup for the same page.
    const reopenedPopup = await openExtensionPopup(context, extensionId, { activePage: page });
    await expect(reopenedPopup.getByTestId('flowforge-result')).toContainText('Chrome backend response');
    await expect(reopenedPopup.getByTestId('flowforge-question-input')).toHaveValue('What is this page about?');
    await reopenedPopup.close();
});

test('clears a completed answer and does not restore it when the popup reopens', async ({
    context,
    extensionId,
    page,
}) => {
    // Given
    await page.goto('/chrome');
    await mockQuery(
        context,
        createQueryResponseFixture({
            result: {
                answer: 'Answer to clear',
                elements: [],
                mode: 'direct',
                topic: null,
            },
        }),
    );
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });
    await popup.getByTestId('flowforge-question-input').fill('What is this page about?');
    await popup.getByTestId('flowforge-question-submit').click();
    await expect(popup.getByTestId('flowforge-result')).toContainText('Answer to clear');

    // When
    await popup.getByTestId('flowforge-clear-result').click();

    // Then
    await expect(popup.getByTestId('flowforge-result')).toHaveCount(0);
    await expect(popup.getByTestId('flowforge-question-input')).toHaveValue('What is this page about?');
    await popup.close();

    const reopenedPopup = await openExtensionPopup(context, extensionId, { activePage: page });
    await expect(reopenedPopup.getByTestId('flowforge-result')).toHaveCount(0);
    await reopenedPopup.close();
});

test('restores loading and receives the completed query after reopening the popup', async ({
    context,
    extensionId,
    page,
}) => {
    // Given
    await page.goto('/chrome');
    await mockQuery(
        context,
        createQueryResponseFixture({
            result: {
                answer: 'Completed after the popup reopened',
                elements: [],
                mode: 'direct',
                topic: null,
            },
        }),
        2500,
    );
    const firstPopup = await openExtensionPopup(context, extensionId, { activePage: page });

    // When: submit and close while the background request is still pending.
    await firstPopup.getByTestId('flowforge-question-input').fill('What is this page about?');
    await firstPopup.getByTestId('flowforge-question-submit').click();
    await expect(firstPopup.getByLabel('Loading')).toBeVisible();
    await firstPopup.close();

    // Then: reopening restores pending state, and the live completion updates it.
    const reopenedPopup = await openExtensionPopup(context, extensionId, { activePage: page });
    await expect(reopenedPopup.getByLabel('Loading')).toBeVisible();
    await expect(reopenedPopup.getByTestId('flowforge-result')).toContainText('Completed after the popup reopened');
    await expect(reopenedPopup.getByLabel('Loading')).toHaveCount(0);
    await reopenedPopup.close();
});

test('keeps a completed answer and warns when its page fingerprint is stale', async ({
    context,
    extensionId,
    page,
}) => {
    await page.goto('/chrome');
    await mockQuery(
        context,
        createQueryResponseFixture({
            result: {
                answer: 'This answer is still useful',
                elements: [{ text: directTarget.text, dataId: directTarget.dataId, action: 'navigate' }],
                mode: 'direct',
                topic: null,
            },
        }),
    );
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });

    await popup.getByTestId('flowforge-question-input').fill('Where are the Chrome docs?');
    await popup.getByTestId('flowforge-question-submit').click();
    await expect(popup.getByTestId('flowforge-result')).toContainText('This answer is still useful');
    await page.locator(`[data-flowforge-id="${directTarget.dataId}"]`).evaluate((element) => element.remove());
    await popup.close();

    const reopenedPopup = await openExtensionPopup(context, extensionId, { activePage: page });
    await expect(reopenedPopup.getByTestId('flowforge-result')).toContainText('This answer is still useful');
    await expect(reopenedPopup.getByRole('note')).toContainText('page has changed');
    await expect(reopenedPopup.getByRole('button', { name: directTarget.text })).toHaveCount(0);
    await reopenedPopup.close();
});

test('auto-highlights a single direct result element from the backend', async ({ context, extensionId, page }) => {
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

    // Then
    await expect(popup.getByTestId('flowforge-result')).toContainText('Chrome backend response');
    await expect(page.getByTestId('flowforge-highlight-label')).toContainText(directTarget.text);
    await expectHighlightToCoverTarget(
        page.getByTestId('flowforge-highlight'),
        page.locator(`[data-flowforge-id="${directTarget.dataId}"]`),
    );

    await popup.close();
});

test('waits for popup selection before highlighting multiple direct result elements', async ({
    context,
    extensionId,
    page,
}) => {
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
                    {
                        text: wizardSteps[0]!.text,
                        dataId: wizardSteps[0]!.dataId,
                        action: 'click',
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
    await expect(popup.getByTestId('flowforge-result')).toContainText('Chrome backend response');
    await expect(page.getByTestId('flowforge-highlight')).toHaveCount(0);

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

test('uses the Markdown inspector controls and shows size stats', async ({ context, extensionId, page }) => {
    // Given
    await page.goto('/chrome');
    const popup = await openExtensionPopup(context, extensionId, { activePage: page });
    await popup.getByTestId('flowforge-open-markdown-inspector').click();
    const markdown = page.getByTestId('flowforge-markdown-viewer');
    const detailLevel = page.getByTestId('flowforge-markdown-detail-level');
    const basics = page.getByTestId('flowforge-markdown-block-basics');

    // Then
    await expect(markdown).toContainText('## Basics');
    await expect(page.getByTestId('flowforge-markdown-stat-html')).toBeVisible();
    await expect(page.getByTestId('flowforge-markdown-stat-text')).toBeVisible();
    await expect(page.getByTestId('flowforge-markdown-stat-markdown')).toBeVisible();
    await expect(page.getByTestId('flowforge-markdown-stat-tokens')).toContainText(/~\d+/);

    // When
    await detailLevel.selectOption('compact');
    await basics.click();

    // Then
    await expect(detailLevel).toHaveValue('compact');
    await expect(basics).toHaveAttribute('aria-checked', 'false');
    await expect(markdown).not.toContainText('## Basics');

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
    await expect(popup.getByTestId('flowforge-open-onboarding')).toBeFocused();
    await expect(page.getByTestId('flowforge-wizard')).toHaveCount(0);

    // When
    const popupClosed = popup.waitForEvent('close');
    await popup.getByTestId('flowforge-open-onboarding').click();
    await expect(page.getByTestId('flowforge-wizard')).toBeVisible();
    await popupClosed;
    await expect(page.getByTestId('flowforge-wizard-start')).toBeFocused();

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
