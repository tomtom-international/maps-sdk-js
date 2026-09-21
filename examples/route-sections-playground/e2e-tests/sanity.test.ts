import { test } from '@playwright/test';
import { TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Each row counts the sections of its type on the route, and the traffic incidents among
        // them change through the day. The chrome shot is compared at zero tolerance, so the counts
        // are pinned and only their styling is what the baseline holds.
        await sanityE2ETest({ page, testInfo: test.info(), uiPinnedValues: { '.section-count': '00' } });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});
