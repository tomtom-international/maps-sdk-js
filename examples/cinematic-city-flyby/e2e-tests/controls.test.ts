import { test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { CINEMATIC_MAP_LOAD_TIMEOUT, TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

// A still camera, as in the sanity shot. The flight keeps loading glyphs, and changing look drops
// that cache while a load is still reading it.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('every control can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    // Each look restyles the buildings, their shadows, the sky, the labels and the effects together, and
    // each city fades in once its tiles are in, which a software renderer takes seconds a frame to draw.
    test.setTimeout(360_000);
    await controlsE2ETest({
        page,
        testInfo: test.info(),
        mapLoadTimeout: CINEMATIC_MAP_LOAD_TIMEOUT,
    });
});
