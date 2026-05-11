import { test } from '@playwright/test';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    // TODO(LSI-264): Enable when flakyness has been fixed
    test.skip('sanity test', async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});
