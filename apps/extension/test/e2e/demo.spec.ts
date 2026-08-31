import { expect, test } from '@playwright/test';
import { expectHighlightToCoverTarget } from './utils';

const demoWalkthroughSteps = [
    { dataId: 'ff00000001', text: 'Click Start to run with real backend' },
    { dataId: 'ff00000002', text: 'Click Demo to run with mock data' },
    { dataId: 'ff00000003', text: 'Click Destroy to remove and clean up' },
    { dataId: 'ff00000011', text: 'Open Embed extension docs for more details' },
];

test('runs the complete demo walkthrough and destroys the runtime', async ({ page }) => {
    // Given
    await page.goto('/demo');

    // When
    await page.getByTestId('sandbox-demo').click();
    await page.getByTestId('flowforge-trigger').click();
    await page.getByTestId('flowforge-example-1').click();
    await page.getByTestId('flowforge-question-submit').click();

    // Then
    await expect(page.getByTestId('flowforge-result')).toContainText('You can start the runtime with a real backend');
    await expect(page.getByTestId('flowforge-wizard')).toBeVisible();

    await page.getByTestId('flowforge-wizard-start').click();

    await expect(page.getByTestId('flowforge-wizard-status')).toContainText('Step 1 of 4');
    await expect(page.getByTestId('flowforge-highlight-label')).toContainText(demoWalkthroughSteps[0]!.text);
    await expectHighlightToCoverTarget(
        page.getByTestId('flowforge-highlight'),
        page.locator(`[data-flowforge-id="${demoWalkthroughSteps[0]!.dataId}"]`),
    );

    await expect(page.getByTestId('flowforge-wizard-prev')).toBeDisabled();
    await expect(page.getByTestId('flowforge-wizard-status')).toContainText('Step 1 of 4');

    for (const [index, step] of demoWalkthroughSteps.slice(1).entries()) {
        await page.getByTestId('flowforge-wizard-next').click();

        await expect(page.getByTestId('flowforge-wizard-status')).toContainText(`Step ${index + 2} of 4`);
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

    await page.getByTestId('sandbox-destroy').click();

    await expect(page.getByTestId('flowforge-shell-root')).toHaveCount(0);
});
