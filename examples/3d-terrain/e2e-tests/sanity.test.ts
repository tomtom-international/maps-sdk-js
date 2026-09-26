import { test } from '@playwright/test';
import { TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    // Terrain + 3D buildings + landmarks re-render continuously, which saturates
    // CI's software rasterizer — the default 60s per-test budget is not enough.
    test.setTimeout(180_000);

    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});
