import { test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

test('every control can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    // Each look restyles the buildings, their shadows and the effects together, which a software
    // renderer takes seconds a frame to draw.
    test.setTimeout(360_000);
    await controlsE2ETest({ page, testInfo: test.info() });
});
