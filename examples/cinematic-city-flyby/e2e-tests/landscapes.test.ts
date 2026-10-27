import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { loadProdExample, surfacesTestTimeout } from '../../src/e2e-test-utils/loadProdExample';
import { waitForSurfacesStill } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors } from '../../src/e2e-test-utils/pageErrors';

// A still camera, so each choice shows its first view rather than a flight a slow runner falls behind.
test.use({ contextOptions: { reducedMotion: 'reduce' } });
// A small page, which a software renderer draws in time over the terrain.
test.use({ viewport: { width: 800, height: 500 } });

// The controls walk tries only the first options of each select, so it never reaches the landscapes,
// which fly over a 3D terrain, nor the Manga look, which draws through a pass of its own.
test('a landscape over the 3D terrain, then the Manga look, draw without an error', { tag: TAG_PROD }, async ({
    page,
}) => {
    // The terrain's tiles, the textured ground and the trees on it take a software renderer seconds a frame.
    test.setTimeout(surfacesTestTimeout(2, 0));
    const pageErrors = await loadProdExample(page, 'cinematic-city-flyby');

    await page.selectOption('#ui-flyby', { label: 'Dolomites' });
    await waitForSurfacesStill(page);
    await page.selectOption('#ui-theme', { label: 'Manga' });
    await waitForSurfacesStill(page);
    expectNoPageErrors(pageErrors);
});
