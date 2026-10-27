import { test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { CINEMATIC_MAP_LOAD_TIMEOUT, TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

// Still wind, so the map draws a frame per change rather than every frame for the whole walk, which
// would starve the examples tested beside it.
test.use({ contextOptions: { reducedMotion: 'reduce' } });
// Half the pixels of the default viewport to draw each frame in, the panel still laid out for a desktop.
test.use({ viewport: { width: 800, height: 560 } });

test('every control can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    // Each hour moves the sun the buildings, the landmarks and the trees cast their shadows from, and
    // the night switch reloads the style under all three: seconds a frame on a software renderer, and a
    // first frame as late as the sanity shot's, which the load budget grows the test's time for.
    await controlsE2ETest({ page, testInfo: test.info(), mapLoadTimeout: CINEMATIC_MAP_LOAD_TIMEOUT });
});
