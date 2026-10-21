import { test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

test('every control can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    await controlsE2ETest({ page, testInfo: test.info() });
});
