import { expect, test } from '@playwright/test';
import { createQueryResponseFixture } from '../fixtures';
import { mockQuery } from './fakes/mockQuery.ts';

test('starts the embedded runtime automatically', async ({ page }) => {
    // Given
    const shellRoot = page.locator('#flowforge-embed-shell-root');

    // When
    await page.goto('/embed');

    // Then
    await expect(shellRoot).toBeAttached();
    await expect.poll(() => shellRoot.evaluate((root) => Boolean(root.shadowRoot))).toBe(true);
    await expect(page.getByRole('button', { name: 'Open FlowForge' })).toBeVisible();
});

test('answers a question through the configured backend', async ({ page }) => {
    // Given
    const question = 'What is this page about?';
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

    // When
    await page.goto('/embed');
    await page.getByRole('button', { name: 'Open FlowForge' }).click();
    await page.getByLabel('Your question').fill(question);
    await page.getByRole('button', { name: 'Ask anything' }).click();

    // Then
    await expect(page.getByText('Direct backend response')).toBeVisible();
});

test('opens the page inspector from the embedded popup', async ({ page }) => {
    // Given
    await page.goto('/embed');
    await page.getByRole('button', { name: 'Open FlowForge' }).click();

    // When
    await page.getByRole('button', { name: 'Inspect page context' }).click();

    // Then
    await expect(page.getByRole('dialog', { name: 'Inspect page context' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Basics' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Interactive' })).toBeVisible();
});

test('runs the demo walkthrough and destroys the runtime', async ({ page }) => {
    // Given
    await page.goto('/demo');

    // When
    await page.getByRole('button', { name: 'Demo' }).click();
    await page.getByRole('button', { name: 'Open FlowForge' }).click();
    await page.getByRole('button', { name: 'How to use the runtime?' }).click();
    await page.getByRole('button', { name: 'Ask anything' }).click();

    // Then
    await expect(page.getByRole('region', { name: 'Figured out' })).toContainText(
        'You can start the runtime with a real backend',
    );
    await expect(page.getByRole('region', { name: 'Runtime Usage' })).toBeVisible();

    await page.getByRole('button', { name: 'Start onboarding' }).click();

    await expect(page.getByText('Step 1 of 4')).toBeVisible();
    await expect(page.getByText('Click Start to run with real backend')).toBeVisible();

    await page.getByRole('button', { name: 'Destroy' }).click();

    await expect(page.locator('#flowforge-embed-shell-root')).toHaveCount(0);
});
