import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

// The example flies on load unless the system asks for less motion, and a moving camera has no baseline.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info(), uiPinnedValues: { '#ui-status': '94 km · 2 hr 14 min' } });
    });
});
