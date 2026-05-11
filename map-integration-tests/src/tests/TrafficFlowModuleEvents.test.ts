import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { LineString } from 'geojson';
import type { TrafficFlowModuleFeature } from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getClickedTopFeature,
    getNumLeftAndRightClicks,
    getPixelCoords,
    initTrafficFlow,
    waitForMapIdle,
} from './util/TestUtils';

const waitForShownFlow = async (page: Page): Promise<TrafficFlowModuleFeature[]> => {
    await page.waitForFunction(
        () => {
            const shown = (globalThis as any).trafficFlow?.getShown();
            return shown !== undefined && shown.trafficFlow.length > 0;
        },
        undefined,
        { timeout: 20000 },
    );
    return page.evaluate(() => (globalThis as any).trafficFlow?.getShown()?.trafficFlow ?? []);
};

const setupFlowClickHandler = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.trafficFlow?.events.on('click', (feature) => {
            mapsSdkThis._numOfClicks++;
            mapsSdkThis._clickedTopFeature = feature;
        });
    });

const unsetFlow = async (page: Page) =>
    page.evaluate(() => {
        (globalThis as MapsSDKThis).trafficFlow = undefined;
    });

test.describe('Traffic flow module events', () => {
    const mapEnv = new MapTestEnv();

    test.afterEach(async ({ page }) => unsetFlow(page));

    // TODO(LSI-263): Enable when flakyness has been fixed
    test.skip('Click on a traffic flow segment fires the click event with roadCategory and relativeSpeed on the feature', async ({
        page,
    }) => {
        // Central London — consistently high traffic flow data density
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });

        await initTrafficFlow(page, { visible: true });
        await waitForMapIdle(page);

        const segments = await waitForShownFlow(page);
        expect(segments.length).toBeGreaterThan(0);

        // Flow features have LineString geometry — pick the midpoint of the first one as a click target
        const lineSegment = segments.find((f) => f.geometry.type === 'LineString');
        expect(lineSegment).toBeDefined();
        const coords = (lineSegment?.geometry as LineString).coordinates;
        const midpoint = coords[Math.floor(coords.length / 2)] as [number, number];
        const pixelCoords = await getPixelCoords(page, midpoint);

        await setupFlowClickHandler(page);
        await page.mouse.click(pixelCoords.x, pixelCoords.y);

        await page.waitForFunction(() => (globalThis as any)._numOfClicks > 0, undefined, { timeout: 5000 });
        expect(await getNumLeftAndRightClicks(page)).toEqual([1, 0]);

        const clickedFeature = await getClickedTopFeature<TrafficFlowModuleFeature>(page);
        expect(typeof clickedFeature.properties.roadCategory).toBe('string');
        expect(clickedFeature.properties.roadCategory.length).toBeGreaterThan(0);
        expect(typeof clickedFeature.properties.relativeSpeed).toBe('number');
        expect(clickedFeature.properties.relativeSpeed).toBeGreaterThanOrEqual(0);
        expect(clickedFeature.properties.relativeSpeed).toBeLessThanOrEqual(1);
        expect(typeof clickedFeature.properties.roadClosure).toBe('boolean');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
