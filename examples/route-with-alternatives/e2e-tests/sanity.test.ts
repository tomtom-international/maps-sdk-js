import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // Each card's duration, distance, roads and comparison follow live traffic, and the chrome shot is
        // compared at near-zero tolerance, so that text is pinned.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            readySelector: '.ui-route-card',
            uiPinnedValues: {
                '.ui-route-card-detail': '0 hr 00 min · 00 km of its own',
                '.ui-route-card-roads': 'via A00',
                '.ui-route-card-compare': 'vs selected: adds toll 00 km',
            },
        });
    });
});
