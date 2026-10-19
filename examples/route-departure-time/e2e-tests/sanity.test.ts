import { test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { sanityE2ETest } from '../../src/e2e-test-utils/sanityE2ETest';

test.describe('sanity', () => {
    test('sanity test - prod', { tag: TAG_PROD }, async ({ page }) => {
        // The bars, and which row is the fastest and checked, follow the same durations, so every row
        // is drawn as an unchecked one of a single width.
        await page.addInitScript(() =>
            addEventListener('DOMContentLoaded', () =>
                document.head.append(
                    Object.assign(document.createElement('style'), {
                        textContent: `
                            .ui-departure-bar { width: 50% !important; background: var(--ui-surface-3) !important; }
                            .ui-departure-duration { font-weight: inherit !important; }
                            .ui-departure input { visibility: hidden !important; }`,
                    }),
                ),
            ),
        );
        // The list appears once all eight routes have landed. The day follows today's date and the
        // durations the predicted traffic, so only their styling is compared.
        await sanityE2ETest({
            page,
            testInfo: test.info(),
            readySelector: '.ui-departure',
            uiPinnedValues: { '#ui-day': 'Monday, 12 October 2026', '.ui-departure-duration': '20 min' },
        });
    });
});
