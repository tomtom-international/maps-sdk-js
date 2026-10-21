import { test } from '@playwright/test';
import { BUILDINGS_EXTRUDE_MS, CINEMATIC_MAP_LOAD_TIMEOUT, TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    // The example orbits unless the reader asks for less motion: a still camera gives a shot to compare.
    test.beforeEach(({ page }) => page.emulateMedia({ reducedMotion: 'reduce' }));

    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            settleMs: BUILDINGS_EXTRUDE_MS,
            mapLoadTimeout: CINEMATIC_MAP_LOAD_TIMEOUT,
        });
    });
});
