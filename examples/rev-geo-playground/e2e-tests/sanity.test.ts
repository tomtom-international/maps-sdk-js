import { test } from '@playwright/test';
import { TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The matched address, the offset and the matched coordinates all come from the live
        // service and move with its map data. The chrome shot is compared at zero tolerance, so
        // they are pinned and only their styling is what the baseline holds.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            uiPinnedValues: { '.ui-summary-value': 'Raadhuisstraat 2, 1012 TJ Amsterdam' },
        });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});
