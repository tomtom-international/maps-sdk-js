import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { EXTRA_SHOT_OPTIONS, loadProdExample, surfacesTestTimeout } from '../../src/e2e-test-utils/loadProdExample';
import { waitForSurfacesStill } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors } from '../../src/e2e-test-utils/pageErrors';

// Still waves, so the shot doesn't catch them mid-ripple.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

// The surfaces' presets follow the style's theme: on a dark style the water mirrors a night sky.
test('on a dark style, the surfaces come back in its colours and its sky', { tag: TAG_PROD }, async ({ page }) => {
    // Two style loads and the shot's stable frames, which a software renderer takes seconds each to draw.
    test.setTimeout(surfacesTestTimeout(1, 1));
    const pageErrors = await loadProdExample(page, 'gl-surfaces-playground');

    await page.selectOption('#ui-mapStyle', 'streetDark');
    // The new style's tiles load before the surfaces composite over them again.
    await waitForSurfacesStill(page);

    await expect(page).toHaveScreenshot('street-dark.png', EXTRA_SHOT_OPTIONS);
    expectNoPageErrors(pageErrors);
});
