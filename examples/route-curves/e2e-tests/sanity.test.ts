import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Each card's numbers follow the routes the live traffic gives, and the chrome shot is compared at
        // near-zero tolerance, so that text is pinned.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            readySelector: '.ui-route-card',
            uiPinnedValues: {
                '.ui-route-card-title': '00% in curves',
                '.ui-route-card-in-curves': '00 min and 00 km of the drive',
                '.ui-route-card-totals': '0 hr 00 min · 000 km · 000 curves',
            },
        });
    });
});
