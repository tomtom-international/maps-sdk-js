import { expect, type Page, test } from '@playwright/test';
import { TAG_PROD } from '../../src/e2e-test-utils/e2eTestConstants';
import { loadProdExample } from '../../src/e2e-test-utils/loadProdExample';

/**
 * What `bloom.only` does over a live map, measured on the bloom canvas.
 *
 * @remarks
 * - **No screenshot per scope**: live traffic at 02:00 differs from a rush-hour baseline by more
 *   than an effect regression would. Each scope's look is pinned in `plugins/map-effects/e2e-tests`.
 * - **Total light, not a count of lit pixels**: a narrower scope keys a subset and the blur only
 *   adds, so the total falls whatever the traffic; a count over a cut reads zero at night.
 * - **Not covered**: the redraw once the styling module lands, which `MapEffects.test.ts` pins.
 */

/** Wide to narrow: the dropdown's values, in its order. */
const SCOPES = ['everything', 'traffic', 'major'] as const;

const loadExample = (page: Page): Promise<string[]> => loadProdExample(page, 'traffic-bloom-effect');

const pickScope = async (page: Page, value: string): Promise<void> => {
    await page.selectOption('#ui-scope', value);
    await page.waitForTimeout(2500);
};

/** The sum of every channel on the bloom overlay: the glow itself, not the map underneath. */
const bloomLight = (page: Page): Promise<number> =>
    page.evaluate(() => {
        const bloom = document.querySelector<HTMLCanvasElement>('canvas[data-effect="bloom"]');
        if (!bloom) throw new Error('the bloom overlay is not in the page');

        const scratch = document.createElement('canvas');
        scratch.width = bloom.width;
        scratch.height = bloom.height;
        const context = scratch.getContext('2d');
        if (!context) throw new Error('no 2D context for the scratch canvas');

        context.drawImage(bloom, 0, 0);
        const { data } = context.getImageData(0, 0, scratch.width, scratch.height);
        let light = 0;
        for (let index = 0; index < data.length; index += 4) {
            light += data[index] + data[index + 1] + data[index + 2];
        }
        return light;
    });

test.describe('bloom scopes', () => {
    test('each scope lights strictly less of the map than the one above it', { tag: TAG_PROD }, async ({ page }) => {
        const consoleErrors = await loadExample(page);

        const light: Record<string, number> = {};
        for (const scope of SCOPES) {
            await pickScope(page, scope);
            light[scope] = await bloomLight(page);
        }

        expect(light.everything).toBeGreaterThan(light.traffic);
        expect(light.traffic).toBeGreaterThan(light.major);
        // Major jams are dark, but a scope still has to light what it names.
        expect(light.major).toBeGreaterThan(0);
        expect(consoleErrors).toHaveLength(0);
    });

    test('the first scope picked after load narrows the glow', { tag: TAG_PROD }, async ({ page }) => {
        await loadExample(page);
        const allTraffic = await bloomLight(page);

        await pickScope(page, 'major');

        expect(await bloomLight(page)).toBeLessThan(allTraffic / 2);
    });
});
