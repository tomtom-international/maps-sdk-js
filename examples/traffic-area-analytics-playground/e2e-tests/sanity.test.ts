import { test } from '@playwright/test';
import { TAG_PROD, TAG_SANDPACK } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The date filters default to a window ending two days ago, so they render different digits
        // every day and would otherwise stale the zero-tolerance baseline overnight.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            uiPinnedValues: { '#filter-start-date': '2026-01-09', '#filter-end-date': '2026-01-15' },
        });
    });

    test('sanity test - sandpack', { tag: TAG_SANDPACK }, async ({ page }) => {
        await sanityE2ETest({ page, testInfo: test.info() });
    });
});
