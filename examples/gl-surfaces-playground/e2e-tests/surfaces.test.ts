import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { EXTRA_SHOT_OPTIONS, loadProdExample, surfacesTestTimeout } from '../../src/e2e-test-utils/loadProdExample';
import { waitForSurfacesStill } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors } from '../../src/e2e-test-utils/pageErrors';

// Still water and grass, so the shots don't catch them mid-wave.
test.use({ contextOptions: { reducedMotion: 'reduce' } });
// A small page, which a software renderer draws in time with the surfaces and the trees on it.
test.use({ viewport: { width: 800, height: 500 } });

// The surfaces the start view has none of: a city square's paving and built-up ground, then a glacier.
test('a city square shows its paving, and a glacier its snow and crevasses', { tag: TAG_PROD }, async ({ page }) => {
    // Each place redraws the surfaces, which a software renderer takes seconds a frame to draw.
    test.setTimeout(surfacesTestTimeout(2, 2));
    const pageErrors = await loadProdExample(page, 'gl-surfaces-playground');

    await page.selectOption('#ui-place', 'Dam Square');
    await waitForSurfacesStill(page);
    await expect(page).toHaveScreenshot('dam-square-paving.png', EXTRA_SHOT_OPTIONS);

    await page.selectOption('#ui-place', 'Aletsch Glacier');
    await waitForSurfacesStill(page);
    await expect(page).toHaveScreenshot('aletsch-glacier.png', EXTRA_SHOT_OPTIONS);
    expectNoPageErrors(pageErrors);
});
