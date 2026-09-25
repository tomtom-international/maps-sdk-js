import { expect, test } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { DEFAULT_MAP_LOAD_TIMEOUT, TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Distances, times, charging stops and the number of places found all move with live data,
        // so only their styling is compared.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            uiPinnedValues: {
                '.ui-step-detail': '4 results',
                '.ui-leg-drive': '300 km · 3 h driving',
                '.ui-leg-stop': '30 min at a charging stop',
            },
        });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});

test.describe('the chain', () => {
    test('every service reports what it contributed, in order', { tag: TAG_PROD }, async ({ page }) => {
        await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/routing-composite/dist/prod`);

        // The last step only appears once all four calls have landed.
        await expect(page.getByTestId('step-3')).not.toBeEmpty({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });
        await expect(page.locator('.ui-step')).toHaveCount(4);

        // Named in the order they are called, because the point is that each feeds the next.
        await expect(page.getByTestId('step-0')).toContainText('geocodeOne');
        await expect(page.getByTestId('step-1')).toContainText('calculateRoute');
        await expect(page.getByTestId('step-2')).toContainText('search');
        await expect(page.getByTestId('step-3')).toContainText('calculateReachableRanges');

        // The status line clears only when the whole chain has finished.
        await expect(page.locator('#ui-status')).toBeEmpty();
    });

    test('the route needs charging stops, and each one reports its stop time', { tag: TAG_PROD }, async ({ page }) => {
        await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/routing-composite/dist/prod`);
        await expect(page.getByTestId('step-3')).not.toBeEmpty({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });

        // More than one leg means the service planned a stop rather than driving straight through.
        const legs = page.locator('.ui-leg');
        expect(await legs.count()).toBeGreaterThan(1);

        // Every leg but the last ends at a stop with a duration; the last one is the arrival.
        await expect(page.getByTestId('leg-0')).toContainText(/at /);
        await expect(legs.last()).toContainText('arrival');
    });
});
