import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The count comes from the live service, and the chrome shot is compared at zero tolerance.
        await sanityE2ETest({ page, testInfo: test.info(), uiPinnedValues: { '#ui-status': '79 places in Paris' } });
    });
});
