import { expect, test } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { DEFAULT_MAP_LOAD_TIMEOUT, TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Per-leg and total times move with live traffic, so only their styling is compared.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            uiPinnedValues: { '.ui-leg-stats': '30 min · 30 km', '.ui-summary-value': '30 min' },
        });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});

test.describe('per-leg options', () => {
    test('the panel lists the calculated legs, folded except the first', { tag: TAG_PROD }, async ({ page }) => {
        await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/route-leg-options-playground/dist/prod`);
        await expect(page.getByTestId('leg-stats-2')).not.toBeEmpty({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });

        // Four stops in, three legs out -- the panel is built from the route, not from a constant.
        await expect(page.locator('.ui-leg')).toHaveCount(3);
        await expect(page.getByTestId('leg-toggle-0')).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByTestId('leg-toggle-1')).toHaveAttribute('aria-expanded', 'false');
        await expect(page.getByTestId('leg-routetype-1')).toBeHidden();

        // The whole heading toggles, not just the chevron.
        await page.getByTestId('leg-heading-1').click();
        await expect(page.getByTestId('leg-toggle-1')).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByTestId('leg-routetype-1')).toBeVisible();
    });

    test('an option set on one leg is sent for that leg alone', { tag: TAG_PROD }, async ({ page }) => {
        const legsSent: unknown[][] = [];
        page.on('request', (request) => {
            if (!request.url().includes('/routes/calculate')) return;

            legsSent.push(JSON.parse(request.postData() ?? '{}').legs ?? []);
        });

        await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/route-leg-options-playground/dist/prod`);
        await expect(page.getByTestId('leg-stats-2')).not.toBeEmpty({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });

        await page.getByTestId('leg-avoid-0-motorways').check();
        await expect(page.getByTestId('leg-choices-0')).toHaveText('No motorways');

        // Leg 2 starts folded, so open it before reaching its controls.
        await page.getByTestId('leg-heading-2').click();
        await page.getByTestId('leg-routetype-2').selectOption('thrilling');
        // The status line clears once the recalculation lands.
        await expect(page.locator('#ui-status')).toBeEmpty({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });

        // Each leg carries only what it was given: the fixed waits the route sets in code, plus the
        // cost model set on that leg alone. The middle leg's options are its wait and nothing else.
        expect(legsSent.at(-1)).toEqual([
            { avoids: [{ name: 'motorways' }], routeStop: { pauseDurationInSeconds: 600 } },
            { routeStop: { pauseDurationInSeconds: 300 } },
            { routeType: 'thrilling' },
        ]);
    });
});
