import { test } from '@playwright/test';
import { BUILDINGS_EXTRUDE_MS, CINEMATIC_MAP_LOAD_TIMEOUT, TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

// Still waves, so the snapshot doesn't catch them mid-ripple.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The buildings with their shadows, the landmarks and the trees draw a frame or two a second
        // under SwiftShader.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            settleMs: BUILDINGS_EXTRUDE_MS,
            mapLoadTimeout: CINEMATIC_MAP_LOAD_TIMEOUT,
        });
    });
});
