import { expect, test } from '@playwright/test';
import { PROD_TEST_SERVER_PORT } from '../../playwright.config';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from '../../src/e2e-test-utils/mapPaint';
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

// Far enough in to be climbing the pass, where the relief is worth photographing.
const ALONG_THE_ROUTE = '450';

// The paint gate cannot see the terrain mesh, which is built from the elevation tiles under the new
// view after they arrive; without the wait the camera is photographed over flat ground.
const TERRAIN_MESH_MS = 4000;

// The map is a tilted 3D scene over satellite imagery, and the terrain mesh arrives in pieces.
const SHOT_TOLERANCE = { maxDiffPixelRatio: 0.15, timeout: 30000 } as const;

// A `thrilling` route with live traffic changes road with closures on the pass, and the camera with it.
const RECORDED_ROUTE = `${import.meta.dirname}/thrilling-route.json`;

test('the camera flies the route with the followed position anchored low', { tag: TAG_PROD }, async ({ page }) => {
    const pageErrors = recordPageErrors(page);

    await page.route('**/maps/orbis/routing/routes/calculate*', (route) => route.fulfill({ path: RECORDED_ROUTE }));
    await enableMapReadback(page);
    await page.goto(`http://localhost:${PROD_TEST_SERVER_PORT}/route-flyover-playground/dist/prod`);
    await waitForMapPainted(page, 30000);

    await page.locator('#ui-position').fill(ALONG_THE_ROUTE);
    await page.waitForTimeout(TERRAIN_MESH_MS);

    await expect(page).toHaveScreenshot('mid-flight.png', SHOT_TOLERANCE);
    expectNoPageErrors(pageErrors);
});
