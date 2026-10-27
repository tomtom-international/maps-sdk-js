import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { EXTRA_SHOT_OPTIONS, loadProdExample, surfacesTestTimeout } from '../../src/e2e-test-utils/loadProdExample';
import { waitForSurfacesStill } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors } from '../../src/e2e-test-utils/pageErrors';

// Still trees, so the shot doesn't catch them mid-sway.
test.use({ contextOptions: { reducedMotion: 'reduce' } });
// A small page, which a software renderer draws in time with the surfaces and the trees on it.
test.use({ viewport: { width: 800, height: 500 } });

// The 3D trees grow from zoom 15, past the start view: a park up close shows them, then in autumn.
test('a park up close grows its 3D trees, coloured for the season', { tag: TAG_PROD }, async ({ page }) => {
    // A place and a season change each redraw the surfaces and the trees, which a software renderer
    // takes seconds a frame to draw.
    test.setTimeout(surfacesTestTimeout(2, 2));
    const pageErrors = await loadProdExample(page, 'gl-surfaces-playground');

    await page.selectOption('#ui-place', 'Vondelpark trees');
    // The park's tiles load before the trees stand on them.
    await waitForSurfacesStill(page);
    await expect(page).toHaveScreenshot('vondelpark-trees.png', EXTRA_SHOT_OPTIONS);

    // The season sits in a section of the panel that opens on a click.
    await page.locator('summary', { hasText: 'Season and colours' }).click();
    await page.selectOption('#ui-season select', 'autumn');
    await waitForSurfacesStill(page);
    await expect(page).toHaveScreenshot('vondelpark-autumn.png', EXTRA_SHOT_OPTIONS);
    expectNoPageErrors(pageErrors);
});
