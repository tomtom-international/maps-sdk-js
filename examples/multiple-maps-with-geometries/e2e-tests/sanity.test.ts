import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

// Sixteen maps, each loading its own style, and a geometry request per city: on a loaded runner the
// page takes up to a minute to go quiet, where a single-map example takes seconds.
const MAP_LOAD_TIMEOUT = 90_000;

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            mapSelector: '#ui-maps-container',
            mapLoadTimeout: MAP_LOAD_TIMEOUT,
        });
    });
});
