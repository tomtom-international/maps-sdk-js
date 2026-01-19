import { test } from '@playwright/test';

test.describe('sanity', () => {
    test('sanity test', async ({ page }) => {
        // TODO: this is an animated map example, so it's tricky to know when to take a screenshot
        // await sanityE2ETest({ page, testInfo: test.info() });
    });
});
