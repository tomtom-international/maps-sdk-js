import { expect, test } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

/**
 * The speed limit signs this playground draws without configuring them.
 *
 * @remarks
 * The example's own `upon-load` shot frames a whole country, where no sign draws: a stretch too
 * short on screen carries none. So this test asks for a view of one stretch through the map's URL
 * hash, which is the only place the signs can be seen at all — and the only baseline that would
 * catch them disappearing from the playground.
 */
test('speed limit signs at the zoom a stretch is readable', { tag: TAG_PROD }, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });

    // A stretch of the Munich-to-Milan route through the Alps, in `#zoom/lat/lng`.
    await page.goto(
        `http://localhost:${PROD_TEST_SERVER_PORT}/route-sections-playground/dist/prod/index.html#11/46.22/9.02`,
    );
    await page.waitForSelector('#sdk-map canvas', { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(6000);

    await expect(page).toHaveScreenshot('speed-limit-signs.png', { maxDiffPixelRatio: 0.15, timeout: 30000 });
    expect(consoleErrors).toHaveLength(0);
});
