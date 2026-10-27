import { expect, test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors, recordPageErrors } from '../../src/e2e-test-utils/pageErrors';
import { getExampleURL } from '../../src/e2e-test-utils/sanityE2ETest';

test('every control can be moved without an error', { tag: TAG_PROD }, async ({ page }) => {
    await controlsE2ETest({ page, testInfo: test.info() });
});

// An explicit opacity or width wins over the one a fill style falls back to, so a style change
// clears both: otherwise `outline` draws exactly like `filled`.
test('a fill style change unsets the opacity and the width', { tag: TAG_PROD }, async ({ page }) => {
    const pageErrors = recordPageErrors(page);
    await enableMapReadback(page);
    await page.goto(getExampleURL(test.info()));
    await waitForMapPainted(page, 30000);

    const fillOpacity = page.locator('#ui-fillOpacity-value');
    const lineWidth = page.locator('#ui-lineWidth-value');
    await expect(fillOpacity).toHaveText('0.35');
    await expect(lineWidth).toHaveText('3');

    await page.selectOption('#ui-fillStyle', 'outline');
    await expect(fillOpacity).toHaveText('unset');
    await expect(lineWidth).toHaveText('unset');

    await page.locator('#ui-lineWidth').fill('8');
    await expect(lineWidth).toHaveText('8');
    expectNoPageErrors(pageErrors);
});
