import { test } from '@playwright/test';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test', async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});
