import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

// The grid exists in the markup from the start, so waiting for it would shoot four blank maps.
// `.ready` is set once every tile has drawn its last frame.
const MAP_SELECTOR = '#ui-maps-container.ready';
// The prod test hides what this selects for its UI snapshot, so it names the maps to keep the tile
// labels painted. MAP_SELECTOR stays on the single grid, for a strict locator that needs one match.
const PROD_MAP_SELECTOR = `${MAP_SELECTOR} .tile-map`;

// Four routes and four maps, so the page needs longer than a single-map example.
const MAP_LOAD_TIMEOUT = 45000;

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
