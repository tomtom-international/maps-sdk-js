import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

// The example prints the reverse-geocode response as JSON; there is no map on the page to wait for.
const OPTIONS = { mapSelector: '#ui-rev-geo-json-output', rendersMap: false };

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info(), ...OPTIONS });
    });
});
