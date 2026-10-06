import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    // Measured in CI: the six isolines, recomputed per run with live traffic, move up to 12% of the
    // page with every band drawn, so the shot cannot tell a lost overlay apart; the page-error gate does.
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info(), maxDiffPixelRatio: 0.2 });
    });
});
