import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    // Measured here: recomputing the isolines per run moves up to 7% of the page, and losing them
    // altogether moves 12%, so the tolerance sits between the two rather than above both. The
    // narrow window is why the page-error gate, not this shot, is what catches a lost overlay.
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info(), maxDiffPixelRatio: 0.1 });
    });
});
