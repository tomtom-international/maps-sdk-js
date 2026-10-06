import { test } from '@playwright/test';
import { TAG_CROSS_BROWSER } from '@testing/core-utils';
import { crossBrowserE2ETest } from '../../src/e2e-test-utils/crossBrowserE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

test.describe('cross-browser', () => {
    test('map loads - prod', { tag: [TAG_PROD, TAG_CROSS_BROWSER] }, async ({ page }) => {
        await crossBrowserE2ETest({ page, testInfo: test.info() });
    });
});
