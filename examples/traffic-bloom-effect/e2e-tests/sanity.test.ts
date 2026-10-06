import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Live flow recolours the roads every run, and the bloom spreads it: the New York night
        // differs from the rush-hour baseline by 0.16–0.18 of the shot.
        await sanityE2ETest({ page, testInfo: test.info(), maxDiffPixelRatio: 0.2 });
    });
});
