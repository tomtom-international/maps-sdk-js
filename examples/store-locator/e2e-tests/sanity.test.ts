import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The list appears only once the geocode and the three routes have landed; drive times, and
        // with them the stores' order, move with live traffic, so only their styling is compared. The
        // map fits the routes, which traffic can move onto other streets: measured 0.17 when one did.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            maxDiffPixelRatio: 0.25,
            readySelector: '.ui-store.ui-selected',
            uiPinnedValues: {
                '.ui-store-name': 'Bakery',
                '.ui-store-address': 'Museumplein 1, 1071 DJ Amsterdam',
                '.ui-store-trip': '5 min · 1.5 km',
            },
        });
    });
});
