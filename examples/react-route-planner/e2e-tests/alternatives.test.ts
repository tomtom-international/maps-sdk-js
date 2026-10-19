import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors, recordPageErrors } from '../../src/e2e-test-utils/pageErrors';
import { getExampleURL } from '../../src/e2e-test-utils/sanityE2ETest';

test('an alternative points at its route, a chip at its road, and a click selects it', { tag: TAG_PROD }, async ({
    page,
}) => {
    const pageErrors = recordPageErrors(page);
    await enableMapReadback(page);
    await page.goto(getExampleURL(test.info()));
    await waitForMapPainted(page, 45000);

    const alternatives = page.locator('.ui-alternative');
    const alternative = alternatives.nth(1);
    await alternative.hover({ timeout: 45000 });
    await expect(alternative).toHaveClass(/ui-hovered/);

    // A chip sits inside its card, so pointing at the road keeps the route pointed at.
    const chip = alternative.locator('.ui-road-chip').first();
    if (await chip.count()) {
        await chip.hover();
        await expect(alternative).toHaveClass(/ui-hovered/);
    }

    await alternative.click();
    await expect(alternative).toHaveClass(/active/);
    await expect(alternatives.first()).not.toHaveClass(/active/);

    await page.mouse.move(0, 0);
    await expect(alternative).not.toHaveClass(/ui-hovered/);
    expectNoPageErrors(pageErrors);
});
