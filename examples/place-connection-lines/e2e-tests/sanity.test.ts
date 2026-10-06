import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The map fits to live search results, so one café swapping in or out pans the whole
        // view: measured 0.23 when a single café changed.
        await sanityE2ETest({ page, testInfo: test.info(), maxDiffPixelRatio: 0.25 });
    });
});
