import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The inverted mask covers the whole viewport, so a sub-tile shift in where the geometry
        // lands repaints most of the image: measured 0.18 between consecutive good runs.
        await sanityE2ETest({ page, testInfo: test.info(), maxDiffPixelRatio: 0.2 });
    });
});
