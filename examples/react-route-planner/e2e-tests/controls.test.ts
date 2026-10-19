import { type Page, test } from '@playwright/test';
import { controlsE2ETest } from '../../src/e2e-test-utils/controlsE2ETest';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';

const openTab = (name: string) => (page: Page) => page.getByRole('tab', { name }).click();

const openMapPanel = async (page: Page) => {
    await page.getByRole('button', { name: 'Map type and layers' }).click();
    await page.locator('.ui-fine-tune summary').click();
};

// The trip slider, walked to both ends, scrubs the flight and so lands it.
const flyOverTrip = async (page: Page) => {
    await openTab('Directions')(page);
    await page.getByRole('button', { name: 'Fly over the trip' }).click();
};

test.describe('every control can be moved without an error', () => {
    for (const [panel, reveal] of [
        ['the plan', undefined],
        ['the search options', openTab('Search')],
        ['the route options', openTab('Options')],
        ['the map panel', openMapPanel],
        ['the directions, mid-flight', flyOverTrip],
    ] as const) {
        test(`in ${panel}`, { tag: TAG_PROD }, async ({ page }) => {
            // Each change recalculates the route and refits the map, which a software renderer
            // takes seconds to draw.
            test.setTimeout(480_000);
            await controlsE2ETest({ page, testInfo: test.info(), maxOptionsPerSelect: 1, reveal });
        });
    }
});
