import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

// The elevation tiles arrive with everything else, but the mesh is built from them afterwards and
// under SwiftShader that takes about three seconds, with nothing changing on screen meanwhile.
// Shot before it, the map is flat, which is the one thing this example must not be photographed as.
// Measured at 3s; 4 for headroom.
const TERRAIN_MESH_MS = 4000;

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info(), settleMs: TERRAIN_MESH_MS });
    });
});
