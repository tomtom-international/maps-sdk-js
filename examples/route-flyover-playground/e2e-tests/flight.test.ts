import { expect, test } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { enableMapReadback, waitForMapPainted, waitForMapStill } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors, recordPageErrors } from '../../src/e2e-test-utils/pageErrors';

/**
 * The camera on the route, with the marker anchored in the lower third: the one claim about the
 * plugin only a picture can make, and one the paused `upon-load` overview cannot.
 *
 * Taken through a seek, which places the camera from the route alone and so the same on every run;
 * a running flight is wherever the frame rate left it.
 */

// A flight started on load would move the camera under the seek.
test.use({ contextOptions: { reducedMotion: 'reduce' } });
// A small page, which a software renderer draws in time over the terrain.
test.use({ viewport: { width: 800, height: 500 } });

// Far enough in to be climbing the pass, where the relief is worth photographing.
const ALONG_THE_ROUTE = '450';

// The paint gate cannot see the terrain mesh, which is built from the elevation tiles under the new
// view after they arrive, and a loaded runner takes seconds a frame over it: the shot waits until the
// map has held still this long, or the camera is photographed over flat ground.
const TERRAIN_QUIET_MS = 4000;
const SETTLE_MS = 120_000;
const PAINT_MS = 30_000;

// The map is a tilted 3D scene over satellite imagery, and the terrain mesh arrives in pieces.
const SHOT_TOLERANCE = { maxDiffPixelRatio: 0.15, timeout: 30000 } as const;

// A `thrilling` route with live traffic changes road with closures on the pass, and the camera with it.
const RECORDED_ROUTE = `${import.meta.dirname}/thrilling-route.json`;

test('the camera flies the route with the followed position anchored low', { tag: TAG_PROD }, async ({ page }) => {
    // The first paint, the settle and the shot at their ceilings, and 15 s for the steps between them.
    test.setTimeout(PAINT_MS + SETTLE_MS + SHOT_TOLERANCE.timeout + 15_000);
    const pageErrors = recordPageErrors(page);

    await page.route('**/maps/orbis/routing/routes/calculate*', (route) => route.fulfill({ path: RECORDED_ROUTE }));
    await enableMapReadback(page);
    await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/route-flyover-playground/dist/prod`);
    await waitForMapPainted(page, PAINT_MS);

    await page.locator('#ui-position').fill(ALONG_THE_ROUTE);
    // Folded, the panel leaves the small page's view to the route.
    await page.getByRole('button', { name: 'Toggle panel' }).click();
    await waitForMapStill(page, TERRAIN_QUIET_MS, SETTLE_MS, SETTLE_MS);

    await expect(page).toHaveScreenshot('mid-flight.png', SHOT_TOLERANCE);
    expectNoPageErrors(pageErrors);
});
