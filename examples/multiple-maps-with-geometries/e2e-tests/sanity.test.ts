import { test } from '@playwright/test';

test.describe('sanity', () => {
    test('sanity test', async ({ page }) => {
        // TODO: create special sanity test for multiple maps with geometries example
        // await sanityE2ETest({ page, testInfo: test.info() });
    });
});
