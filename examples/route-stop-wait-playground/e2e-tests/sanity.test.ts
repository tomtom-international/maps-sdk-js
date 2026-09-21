import { expect, test } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { DEFAULT_MAP_LOAD_TIMEOUT, TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Distance, times and the arrival clock all move with live traffic and the time of day, so
        // only their styling is compared.
        await sanityE2ETest({ page, testInfo: test.info(), uiPinnedValues: { '.ui-summary-value': '1 hr 00 min' } });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});

test.describe('the wait reaches the request', () => {
    test('moving the slider sends the new wait on the arriving leg', { tag: TAG_PROD }, async ({ page }) => {
        // Asserted on the request rather than on the reported times, which move with traffic.
        const waits: (number | undefined)[] = [];
        page.on('request', (request) => {
            if (!request.url().includes('/routes/calculate')) return;

            const body = JSON.parse(request.postData() ?? '{}');
            waits.push(body.legs?.[0]?.routeStop?.pauseDurationInSeconds);
        });

        await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/route-stop-wait-playground/dist/prod`);
        await expect(page.locator('#ui-summary .ui-summary-value').first()).toBeVisible({
            timeout: DEFAULT_MAP_LOAD_TIMEOUT,
        });

        // The default 30 minutes, then a change, then a wait of zero.
        expect(waits).toEqual([30 * 60]);

        const slider = page.locator('#ui-waitSlider');
        await slider.fill('90');
        await slider.dispatchEvent('change');
        await expect(page.getByText('1 hr 30 min')).toBeVisible({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });
        expect(waits.at(-1)).toBe(90 * 60);

        await slider.fill('0');
        await slider.dispatchEvent('change');
        await expect(page.getByText('none')).toBeVisible({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });
        // A wait of zero is left out of the request entirely rather than sent as 0.
        expect(waits.at(-1)).toBeUndefined();
    });
});
