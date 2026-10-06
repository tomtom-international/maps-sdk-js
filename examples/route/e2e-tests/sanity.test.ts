import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Historical traffic for the hour of the run picks the path, and live incidents mark it:
        // measured 0.16 between New York's morning rush and the baseline's quieter hour.
        await sanityE2ETest({ page, testInfo: test.info(), maxDiffPixelRatio: 0.25 });
    });
});
