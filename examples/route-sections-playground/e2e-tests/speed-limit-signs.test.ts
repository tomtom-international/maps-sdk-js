import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { EXTRA_SHOT_OPTIONS, loadProdExample } from '../../src/e2e-test-utils/loadProdExample';
import { expectNoPageErrors } from '../../src/e2e-test-utils/pageErrors';

/**
 * The speed limit signs this playground draws without configuring them.
 *
 * @remarks
 * The example's own `upon-load` shot frames a whole country, where no sign draws: a stretch too
 * short on screen carries none. So this test asks for a view of one stretch through the map's URL
 * hash, which is the only place the signs can be seen at all.
 *
 * The shot's tolerance absorbs live-tile drift, which outweighs a few signs, so it shows them to a
 * reviewer rather than guarding them: `map-integration-tests` asserts that they draw.
 */
test('speed limit signs at the zoom a stretch is readable', { tag: TAG_PROD }, async ({ page }) => {
    // A stretch of the Munich-to-Milan route through the Alps, in `zoom/lat/lng`.
    const pageErrors = await loadProdExample(page, 'route-sections-playground', '12.5/46.22/9.02');

    await expect(page).toHaveScreenshot('speed-limit-signs.png', EXTRA_SHOT_OPTIONS);
    expectNoPageErrors(pageErrors);
});
