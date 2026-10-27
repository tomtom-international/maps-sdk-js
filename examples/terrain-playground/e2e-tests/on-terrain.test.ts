import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { EXTRA_SHOT_OPTIONS, loadProdExample, surfacesTestTimeout } from '../../src/e2e-test-utils/loadProdExample';
import { waitForMapStill } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors } from '../../src/e2e-test-utils/pageErrors';

// A software renderer takes seconds a frame over the terrain, so the map settles and shoots slowly.
const SETTLE_MS = 150_000;
const SHOT_MS = 60_000;

// Still water and trees, so the shot doesn't catch them mid-wave.
test.use({ contextOptions: { reducedMotion: 'reduce' } });
// A small page, which a software renderer draws in time with the surfaces and the trees on it.
test.use({ viewport: { width: 800, height: 500 } });

// The 3D buildings, the textured lake and woods and the trees all stand on the raised ground.
test('the buildings and the textured surfaces stand on the terrain', { tag: TAG_PROD }, async ({ page }) => {
    // The terrain, the buildings and the surfaces each take seconds a frame on a software renderer.
    test.setTimeout(surfacesTestTimeout(1, 1, { settleMs: SETTLE_MS, shotMs: SHOT_MS }));
    const pageErrors = await loadProdExample(page, 'terrain-playground');

    await page.selectOption('#ui-viewpoint', { label: 'Hallstatt, Austria' });
    await page.locator('label:has(#ui-buildings)').click();
    await page.locator('label:has(#ui-surfaces)').click();
    // The flight to Hallstatt, then its tiles, its elevation and the buildings on it.
    await waitForMapStill(page, 4000, SETTLE_MS, SETTLE_MS);
    await expect(page).toHaveScreenshot('hallstatt-on-terrain.png', { ...EXTRA_SHOT_OPTIONS, timeout: SHOT_MS });
    expectNoPageErrors(pageErrors);
});
