import { test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

test('every control can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    // The 3D buildings and the textured surfaces over the terrain take a software renderer too long a
    // frame for the other controls to follow; on-terrain.test.ts draws them.
    await controlsE2ETest({ page, testInfo: test.info(), skip: ['#ui-buildings', '#ui-surfaces'] });
});
