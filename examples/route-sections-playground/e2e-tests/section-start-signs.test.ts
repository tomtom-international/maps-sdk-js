import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { EXTRA_SHOT_OPTIONS, loadProdExample } from '../../src/e2e-test-utils/loadProdExample';

/**
 * The signs this playground posts where a tunnel and a restricted stretch start.
 *
 * @remarks
 * Like the speed limit signs, they draw from zoom 10 and the example opens on a whole country, so
 * each view is asked for through the map's URL hash, in `zoom/lat/lng`, on the Munich-to-Milan route.
 */
test.describe('section start signs', () => {
    test('a tunnel posts its sign where it starts', { tag: TAG_PROD }, async ({ page }) => {
        // The Pfänder tunnel, by Bregenz.
        const consoleErrors = await loadProdExample(page, 'route-sections-playground', '16/47.5392/9.7568');

        await expect(page).toHaveScreenshot('tunnel-sign.png', EXTRA_SHOT_OPTIONS);
        expect(consoleErrors).toHaveLength(0);
    });

    test('a restricted stretch posts its closed sign where it starts', { tag: TAG_PROD }, async ({ page }) => {
        // The pedestrian streets around the Duomo, which the route has to take to reach its end.
        const consoleErrors = await loadProdExample(page, 'route-sections-playground', '17/45.4649/9.1893');

        await expect(page).toHaveScreenshot('vehicle-restricted-sign.png', EXTRA_SHOT_OPTIONS);
        expect(consoleErrors).toHaveLength(0);
    });
});
