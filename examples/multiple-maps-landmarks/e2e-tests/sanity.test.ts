import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

const MAP_SELECTOR = '#ui-map-grid';
// The prod test hides what this selects for its UI snapshot, so it names the maps to keep the tile
// labels painted. MAP_SELECTOR stays on the single grid, for a strict locator that needs one match.
const PROD_MAP_SELECTOR = `${MAP_SELECTOR} .ui-map-tile-map`;

// Four maps each load their own style and imagery, so the page takes several times one map's load.
const MAP_LOAD_TIMEOUT = 45_000;

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            mapSelector: PROD_MAP_SELECTOR,
            mapLoadTimeout: MAP_LOAD_TIMEOUT,
        });
    });
});
