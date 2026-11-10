import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors, recordPageErrors } from '../../src/e2e-test-utils/pageErrors';
import { getExampleURL } from '../../src/e2e-test-utils/sanityE2ETest';

test('a stretch search keeps its places after a stop, and closing the card returns to the route', {
    tag: TAG_PROD,
}, async ({ page }) => {
    test.setTimeout(180_000);
    const pageErrors = recordPageErrors(page);
    await enableMapReadback(page);
    await page.goto(getExampleURL(test.info()));
    await waitForMapPainted(page, 45_000);

    const country = page.locator('.ui-lane-country').first();
    await expect(country).toBeVisible({ timeout: 45_000 });
    await country.click();

    const searchAlong = page.getByRole('button', { name: 'Search along this stretch' });
    await searchAlong.click();
    await expect(page.getByRole('tab', { name: 'Search' })).toHaveAttribute('aria-selected', 'true');
    const stretch = page.getByRole('radio', { name: 'This stretch' });
    await expect(stretch).toBeChecked();

    await page.getByRole('button', { name: 'Close the section details' }).click();
    await expect(stretch).toHaveCount(0);
    await expect(page.getByRole('radio', { name: 'Along the route' })).toBeChecked();

    await country.click();
    await searchAlong.click();
    await expect(stretch).toBeChecked();
    await page.getByRole('button', { name: 'Coffee', exact: true }).click();

    const titles = page.locator('.ui-suggestion-title');
    await expect(titles.first()).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('.ui-search-results [role="status"]')).toHaveCount(0);
    const before = await titles.allTextContents();
    const added = before[0];
    await page.getByRole('button', { name: `Add ${added} to the route`, exact: true }).click();

    await expect(page.getByRole('button', { name: 'Close the section details' })).toHaveCount(0, { timeout: 45_000 });
    await expect(stretch).toBeChecked();
    await expect(page.locator('.ui-search-results-header')).toContainText('along this stretch');
    await expect(titles).toHaveText(before.slice(1));
    expectNoPageErrors(pageErrors);
});
