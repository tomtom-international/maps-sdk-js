import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The summary is printed once the route is drawn; its travel time moves with live traffic, so
        // only its styling is compared.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            readySelector: '#ui-summary:not(:empty)',
            uiPinnedValues: { '#ui-summary': '47 km, 37 min' },
        });
    });
});
