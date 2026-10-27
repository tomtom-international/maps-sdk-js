import { test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

// Half the pixels of the default viewport to draw each frame in, the panel still laid out for a desktop.
test.use({ viewport: { width: 800, height: 560 } });

test('every control can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    // The 3D buildings and the textured surfaces over the terrain take a software renderer too long a
    // frame for the other controls to follow; the terrain playground's on-terrain.test.ts draws them.
    await controlsE2ETest({ page, testInfo: test.info(), skip: ['#ui-buildings', '#ui-surfaces'] });
});
