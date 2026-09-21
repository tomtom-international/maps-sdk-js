import { test } from '@playwright/test';
import { TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

// The grid exists in the markup from the start, so waiting for it would shoot four blank maps.
// `.ready` is set once every tile has drawn its last frame.
const MAP_SELECTOR = '#ui-maps-container.ready';

// Four routes and four maps, so the page needs longer than a single-map example.
const MAP_LOAD_TIMEOUT = 45000;

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            mapSelector: MAP_SELECTOR,
            mapLoadTimeout: MAP_LOAD_TIMEOUT,
        });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            mapSelector: MAP_SELECTOR,
            mapLoadTimeout: MAP_LOAD_TIMEOUT,
        });
    });
});
