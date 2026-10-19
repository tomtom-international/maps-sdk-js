import { expect, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { enableMapReadback, waitForMapPainted } from '../../src/e2e-test-utils/mapPaint';
import { expectNoPageErrors, recordPageErrors } from '../../src/e2e-test-utils/pageErrors';
import { getExampleURL } from '../../src/e2e-test-utils/sanityE2ETest';

test('a card points at its route, a chip at its road, a click selects the route, and the others weigh against it or the usual route', {
    tag: TAG_PROD,
}, async ({ page }) => {
    const pageErrors = recordPageErrors(page);
    await enableMapReadback(page);
    await page.goto(getExampleURL(test.info()));
    await waitForMapPainted(page, 30000);

    const cards = page.locator('.ui-route-card');
    const alternative = cards.nth(1);
    await alternative.hover({ timeout: 30000 });
    await expect(alternative).toHaveClass(/ui-hovered/);

    // A chip sits inside its card, so pointing at the road keeps the route pointed at.
    const chip = alternative.locator('.ui-road-chip').first();
    if (await chip.count()) {
        await chip.hover();
        await expect(alternative).toHaveClass(/ui-hovered/);
    }

    // Every card but the selected one weighs its route against the selected one.
    await expect(cards.first().locator('.ui-route-card-compare')).toBeHidden();
    await expect(alternative.locator('.ui-route-card-compare')).toContainText('vs selected: ');

    await alternative.click();
    await expect(alternative).toHaveClass(/active/);
    await expect(cards.first()).not.toHaveClass(/active/);
    await expect(alternative.locator('.ui-route-card-compare')).toBeHidden();
    await expect(cards.first().locator('.ui-route-card-compare')).toContainText('vs selected: ');

    // Against the usual route, every card weighs its route, the selected one too.
    const compareUsual = page.locator('.ui-toggle-label', { hasText: 'Compare with the usual route' });
    await compareUsual.click();
    for (const card of await cards.all()) {
        await expect(card.locator('.ui-route-card-compare')).toContainText('vs usual route: ', { timeout: 30000 });
    }
    await compareUsual.click();
    await expect(alternative.locator('.ui-route-card-compare')).toBeHidden();

    await page.mouse.move(0, 0);
    await expect(alternative).not.toHaveClass(/ui-hovered/);
    expectNoPageErrors(pageErrors);
});
