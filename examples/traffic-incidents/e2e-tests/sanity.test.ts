import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Which incidents are live changes every run, so the diff is spread across the whole map pane.
        await sanityE2ETest({ page, testInfo: test.info(), maxDiffPixelRatio: 0.2 });
    });
});
