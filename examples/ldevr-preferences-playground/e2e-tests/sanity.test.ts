import { expect, test } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { DEFAULT_MAP_LOAD_TIMEOUT, TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Distances, durations and the charging stops the service picks all move between runs, so
        // only their styling is compared.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            uiPinnedValues: {
                '.ui-summary-value': '1 hr 00 min',
                '.ui-stop-name': 'Charging park',
                '.ui-stop-detail': '30 min at the stop',
            },
        });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});

test.describe('charging preferences', () => {
    const gotoPlayground = async (page: import('@playwright/test').Page) => {
        await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/ldevr-preferences-playground/dist/prod`);
        // The route has to come back before there is anything to assert: this one plans charging.
        await expect(page.locator('#ui-stops li').first()).toBeVisible({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });
        await expect(page.locator('#ui-status')).toBeEmpty({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });
    };

    test('the route plans charging stops, each listed with the time spent there', { tag: TAG_PROD }, async ({
        page,
    }) => {
        await gotoPlayground(page);

        // Which stops the service picks varies, but a 40 kWh vehicle cannot reach Amsterdam from
        // Paris without charging somewhere.
        const stops = page.locator('#ui-stops li');
        expect(await stops.count()).toBeGreaterThan(0);
        await expect(stops.first().locator('.ui-stop-detail')).toContainText('at the stop');
        await expect(page.locator('#ui-summary')).toContainText('Charging');
    });

    test('the charging time offset reaches the request and lengthens every stop', { tag: TAG_PROD }, async ({
        page,
    }) => {
        const offsetsSent: (number | undefined)[] = [];
        page.on('request', (request) => {
            if (!request.url().includes('calculateLongDistanceEVRoute')) return;

            const body = JSON.parse(request.postData() ?? '{}');
            offsetsSent.push(body.chargingParameters?.chargingTimeOffsetInSec);
        });

        await gotoPlayground(page);
        expect(offsetsSent).toEqual([60]);

        const readStopTotals = () =>
            page
                .locator('#ui-stops .ui-stop-detail')
                .allInnerTexts()
                .then((texts) => texts.join(' | '));
        const before = await readStopTotals();

        // 1 minute per stop up to 20: the offset is added to every charging stop, so each one has to
        // get longer. Asserted on the request as well, since the times themselves move with traffic.
        const offsetSlider = page.locator('#ui-offsetSlider');
        await offsetSlider.fill('1200');
        await offsetSlider.dispatchEvent('change');
        await expect(page.locator('#ui-status')).toBeEmpty({ timeout: DEFAULT_MAP_LOAD_TIMEOUT });
        await expect(page.locator('#ui-offsetValue')).toHaveText('20 min');

        expect(offsetsSent.at(-1)).toBe(1200);
        await expect.poll(readStopTotals, { timeout: DEFAULT_MAP_LOAD_TIMEOUT }).not.toEqual(before);
    });
});
