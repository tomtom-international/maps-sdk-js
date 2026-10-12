import { test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

test('every control can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    // The middle of a 2×2 grid is the gap between its maps, so there is no map there to click.
    await controlsE2ETest({ page, testInfo: test.info(), mapSelector: '#ui-map-grid', clickMap: false });
});
