import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

const MAP_SELECTOR = '#ui-map-grid';

// Four maps each load their own style and tiles, so the page takes several times one map's load.
const MAP_LOAD_TIMEOUT = 45_000;

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            mapSelector: MAP_SELECTOR,
            mapLoadTimeout: MAP_LOAD_TIMEOUT,
        });
    });
});
