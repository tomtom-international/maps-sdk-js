import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The legend is complete once all three result sets are shown. Their counts follow the live
        // POI data, so only their styling is compared.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            readySelector: '#legend li:nth-child(3)',
            uiPinnedValues: { '.ui-legend-count': '(10)' },
        });
    });
});
