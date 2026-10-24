import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createQueryResponseFixture } from '../fixtures';
import { mockQuery } from './fakes/mockQuery';
import { expectHighlightToCoverTarget } from './utils';

async function openInspectorWithoutTab(page: Page) {
    await page.evaluate(() => {
        const runtime = (
            window as Window & {
                flowForgeRuntime?: { openPageInspector(tab?: string): Promise<void> };
            }
        ).flowForgeRuntime;
        if (!runtime) throw new Error('Embed runtime not found');
        return runtime.openPageInspector();
    });
}

const directTarget = {
    dataId: 'ff20000011',
    text: 'Open Embed runtime docs',
};

const wizardSteps = [
    { dataId: 'ff20000001', text: 'Open account settings' },
    { dataId: 'ff20000002', text: 'Review project status' },
    { dataId: 'ff20000003', text: 'Invite a teammate' },
];

test('starts the embedded runtime automatically', async ({ page }) => {
    // Given
    const shellRoot = page.getByTestId('flowforge-shell-root');

    // When
    await page.goto('/embed');

    // Then
    await expect(shellRoot).toBeAttached();
    await expect(shellRoot).toHaveAttribute('id', 'flowforge-extension-embed-shell-root');
    await expect.poll(() => shellRoot.evaluate((root) => Boolean(root.shadowRoot))).toBe(true);
    await expect(page.getByTestId('flowforge-trigger')).toBeVisible();
});

test('opens and closes the embedded popup from trigger, escape, and outside click', async ({ page }) => {
    // Given
    await page.goto('/embed');
    const popup = page.getByTestId('flowforge-popup');
    const trigger = page.getByTestId('flowforge-trigger');
    const pageHeading = page.getByTestId('sandbox-heading');

    // When/Then: trigger opens and closes the popup
    await trigger.click();
    await expect(popup).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await trigger.press('Enter');
    await expect(popup).toHaveCount(0);
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // When/Then: escape closes the popup when focus is outside editable fields
    await trigger.click();
    await expect(popup).toBeVisible();
    await page.getByTestId('flowforge-popup-content').click();
    await page.keyboard.press('Escape');
    await expect(popup).toHaveCount(0);

    // When/Then: clicking the host page outside the shell closes the popup
    await trigger.click();
    await expect(popup).toBeVisible();
    await pageHeading.click();
    await expect(popup).toHaveCount(0);
});

test('answers a question through the configured backend', async ({ page }) => {
    // Given
    await mockQuery(
        page,
        createQueryResponseFixture({
            result: {
                answer: 'Direct backend response',
                elements: [],
                mode: 'direct',
                topic: null,
            },
        }),
    );
    await page.goto('/embed');
    await page.getByTestId('flowforge-trigger').click();

    // When
    await page.getByTestId('flowforge-question-input').fill('What is this page about?');
    await page.getByTestId('flowforge-question-submit').click();

    // Then
    await expect(page.getByTestId('flowforge-result')).toContainText('Direct backend response');
});

test('clears a completed answer and does not restore it when the popup reopens', async ({ page }) => {
    // Given
    await mockQuery(
        page,
        createQueryResponseFixture({
            result: {
                answer: 'Answer to clear',
                elements: [],
                mode: 'direct',
                topic: null,
            },
        }),
    );
    await page.goto('/embed');
    const trigger = page.getByTestId('flowforge-trigger');
    await trigger.click();
    await page.getByTestId('flowforge-question-input').fill('What is this page about?');
    await page.getByTestId('flowforge-question-submit').click();
    await expect(page.getByTestId('flowforge-result')).toContainText('Answer to clear');

    // When
    await page.getByTestId('flowforge-clear-result').click();

    // Then
    await expect(page.getByTestId('flowforge-result')).toHaveCount(0);
    await expect(page.getByTestId('flowforge-question-input')).toHaveValue('What is this page about?');
    await page.getByTestId('sandbox-heading').click();
    await expect(page.getByTestId('flowforge-popup')).toHaveCount(0);

    await trigger.click();
    await expect(page.getByTestId('flowforge-popup')).toBeVisible();
    await expect(page.getByTestId('flowforge-result')).toHaveCount(0);
});

test('restores a result despite unrelated IDs and warns when a referenced element disappears', async ({ page }) => {
    // Given
    await mockQuery(
        page,
        createQueryResponseFixture({
            result: {
                answer: 'This answer is still useful',
                elements: [{ text: directTarget.text, dataId: directTarget.dataId, action: 'navigate' }],
                mode: 'direct',
                topic: null,
            },
        }),
    );
    await page.goto('/embed');
    const trigger = page.getByTestId('flowforge-trigger');
    await trigger.click();
    await page.getByTestId('flowforge-question-input').fill('Where are the Embed docs?');
    await page.getByTestId('flowforge-question-submit').click();
    await expect(page.getByTestId('flowforge-result')).toContainText('This answer is still useful');

    // When: a new unrelated ID appears before the popup is reopened.
    await page.evaluate(() => {
        const unrelatedElement = document.createElement('div');
        unrelatedElement.setAttribute('data-flowforge-id', 'ff99999999');
        document.body.append(unrelatedElement);
    });
    await page.getByTestId('sandbox-heading').click();
    await trigger.click();

    // Then: the result remains actionable until its referenced element is removed.
    await expect(page.getByTestId('flowforge-result')).toContainText('This answer is still useful');
    await expect(page.getByRole('note')).toHaveCount(0);
    await expect(page.getByRole('button', { name: directTarget.text })).toBeVisible();

    await page.locator(`[data-flowforge-id="${directTarget.dataId}"]`).evaluate((element) => element.remove());
    await page.getByTestId('sandbox-heading').click();
    await trigger.click();

    await expect(page.getByTestId('flowforge-result')).toContainText('This answer is still useful');
    await expect(page.getByRole('note')).toContainText('page has changed');
    await expect(page.getByRole('button', { name: directTarget.text })).toHaveCount(0);
});

test('auto-highlights a single direct result element from the backend', async ({ page }) => {
    // Given
    await mockQuery(
        page,
        createQueryResponseFixture({
            result: {
                answer: 'Direct backend response',
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
    await page.goto('/embed');
    await page.getByTestId('flowforge-trigger').click();

    // When
    await page.getByTestId('flowforge-question-input').fill('Where are the docs?');
    await page.getByTestId('flowforge-question-submit').click();

    // Then
    await expect(page.getByTestId('flowforge-result')).toContainText('Direct backend response');
    await expect(page.getByTestId('flowforge-highlight-label')).toContainText(directTarget.text);
    await expectHighlightToCoverTarget(
        page.getByTestId('flowforge-highlight'),
        page.locator(`[data-flowforge-id="${directTarget.dataId}"]`),
    );
});

test('waits for popup selection before highlighting multiple direct result elements', async ({ page }) => {
    // Given
    await mockQuery(
        page,
        createQueryResponseFixture({
            result: {
                answer: 'Direct backend response',
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
    await page.goto('/embed');
    await page.getByTestId('flowforge-trigger').click();

    // When
    await page.getByTestId('flowforge-question-input').fill('Where are the docs?');
    await page.getByTestId('flowforge-question-submit').click();
    await expect(page.getByTestId('flowforge-result')).toContainText('Direct backend response');
    await expect(page.getByTestId('flowforge-highlight')).toHaveCount(0);

    await page.getByTestId(`flowforge-result-element-${directTarget.dataId}`).click();

    // Then
    await expect(page.getByTestId('flowforge-highlight-label')).toContainText(directTarget.text);
    await expectHighlightToCoverTarget(
        page.getByTestId('flowforge-highlight'),
        page.locator(`[data-flowforge-id="${directTarget.dataId}"]`),
    );
});

test('opens the page inspector from the popup', async ({ page }) => {
    // Given
    await page.goto('/embed');
    await page.getByTestId('flowforge-trigger').click();

    // When
    await page.getByTestId('flowforge-open-inspector').click();

    // Then
    await expect(page.getByTestId('flowforge-inspector')).toBeVisible();
    await expect(page.getByTestId('flowforge-modal-title')).toHaveText('FlowForge — Page Inspector');
    await expect(page.getByTestId('flowforge-inspector-tab-basics')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector-tab-interactive')).toBeVisible();
    await expect(page.getByTestId('flowforge-modal-container')).toBeVisible();

    await page.getByTestId('flowforge-modal-close').click();
    await expect(page.getByTestId('flowforge-inspector')).toHaveCount(0);
});

test('opens the Markdown inspector tab from the popup', async ({ page }) => {
    // Given
    await page.goto('/embed');
    await page.getByTestId('flowforge-trigger').click();

    // When
    await page.getByTestId('flowforge-open-markdown-inspector').click();

    // Then
    await expect(page.getByTestId('flowforge-inspector')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector-tab-markdown')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('flowforge-markdown-viewer')).toContainText('Explore Embed Runtime');
});

test('persists the selected Inspector tab and Markdown settings across openings', async ({ page }) => {
    // Given
    await page.goto('/embed');
    await page.getByTestId('flowforge-trigger').click();
    await page.getByTestId('flowforge-open-inspector').click();
    await expect(page.getByTestId('flowforge-inspector')).toBeVisible();

    // When
    await page.getByTestId('flowforge-inspector-tab-markdown').click();
    const detailLevel = page.getByTestId('flowforge-markdown-detail-level');
    const basicsBlock = page.getByTestId('flowforge-markdown-block-basics');
    await detailLevel.selectOption('compact');
    await basicsBlock.click();
    await page.getByTestId('flowforge-inspector-tab-interactive').click();
    await expect
        .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('flowforge_settings') ?? '{}')))
        .toMatchObject({
            inspectorTab: 'interactive',
            markdownDetailLevel: 'compact',
            markdownBlocks: ['structure', 'interactive', 'content'],
        });
    await page.getByTestId('flowforge-modal-close').click();
    await page.reload();
    await expect(page.getByTestId('flowforge-trigger')).toBeVisible();

    // Opening through the Runtime API without a requested tab restores the saved selection after a runtime restart.
    await openInspectorWithoutTab(page);
    await expect(page.getByTestId('flowforge-inspector-tab-interactive')).toHaveAttribute('aria-selected', 'true');

    // Markdown controls were restored from localStorage too; save Markdown as the selected tab.
    await page.getByTestId('flowforge-inspector-tab-markdown').click();
    await expect(page.getByTestId('flowforge-markdown-detail-level')).toHaveValue('compact');
    await expect(page.getByTestId('flowforge-markdown-block-basics')).toHaveAttribute('aria-checked', 'false');
    await page.getByTestId('flowforge-modal-close').click();
    await page.reload();
    await expect(page.getByTestId('flowforge-trigger')).toBeVisible();
    await openInspectorWithoutTab(page);

    // Then
    await expect(page.getByTestId('flowforge-inspector-tab-markdown')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('flowforge-markdown-detail-level')).toHaveValue('compact');
    await expect(page.getByTestId('flowforge-markdown-block-basics')).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('flowforge-markdown-viewer')).not.toContainText('## Basics');
    await page.getByTestId('flowforge-modal-close').click();
});

test('clears page state when the popup opens', async ({ page }) => {
    // Given
    await page.goto('/embed');
    await page.getByTestId('flowforge-trigger').click();
    await page.getByTestId('flowforge-open-inspector').click();
    await expect(page.getByTestId('flowforge-inspector')).toBeVisible();

    // When
    await page.getByTestId('flowforge-trigger').click();

    // Then
    await expect(page.getByTestId('flowforge-popup')).toBeVisible();
    await expect(page.getByTestId('flowforge-inspector')).toHaveCount(0);
});

test('runs wizard onboarding through the configured backend', async ({ page }) => {
    // Given
    await mockQuery(
        page,
        createQueryResponseFixture({
            result: {
                answer: 'Follow the embed runtime controls.',
                elements: wizardSteps.map((step) => ({
                    text: step.text,
                    dataId: step.dataId,
                    action: 'click',
                })),
                mode: 'steps',
                topic: 'Embed Runtime',
            },
        }),
    );
    await page.goto('/embed');
    await page.getByTestId('flowforge-trigger').click();

    // When
    await page.getByTestId('flowforge-question-input').fill('How do I use the embed runtime?');
    await page.getByTestId('flowforge-question-submit').click();

    // Then
    await expect(page.getByTestId('flowforge-result')).toContainText('Follow the embed runtime controls.');
    await expect(page.getByTestId('flowforge-open-onboarding')).toBeFocused();
    await expect(page.getByTestId('flowforge-wizard')).toHaveCount(0);

    // When
    await page.getByTestId('flowforge-open-onboarding').click();
    await expect(page.getByTestId('flowforge-wizard')).toBeVisible();
    await expect(page.getByTestId('flowforge-popup')).toHaveCount(0);
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
});
