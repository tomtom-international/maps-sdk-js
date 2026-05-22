import { test } from '@playwright/test';
import { TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info(), mapSelector: '#sdk-example-rev-geo-json-output' });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info(), mapSelector: '#sdk-example-rev-geo-json-output' });
    });
});
