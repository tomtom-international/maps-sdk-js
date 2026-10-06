import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The status line reports a live incident count for London, which changes run to run.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            uiPinnedValues: { '#ui-status': 'N incidents in London. Click one for details.' },
        });
    });
});
