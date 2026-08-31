import { expect, type Locator } from '@playwright/test';

export async function expectHighlightToCoverTarget(highlight: Locator, target: Locator) {
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveClass(/flowforge-highlight--visible/);
    await expect(highlight).toHaveCSS('opacity', '1');

    const [highlightBox, targetBox] = await Promise.all([highlight.boundingBox(), target.boundingBox()]);

    expect(highlightBox).not.toBeNull();
    expect(targetBox).not.toBeNull();

    const tolerance = 1;
    expect(highlightBox!.x).toBeLessThanOrEqual(targetBox!.x + tolerance);
    expect(highlightBox!.y).toBeLessThanOrEqual(targetBox!.y + tolerance);
    expect(highlightBox!.x + highlightBox!.width).toBeGreaterThanOrEqual(targetBox!.x + targetBox!.width - tolerance);
    expect(highlightBox!.y + highlightBox!.height).toBeGreaterThanOrEqual(targetBox!.y + targetBox!.height - tolerance);
}
