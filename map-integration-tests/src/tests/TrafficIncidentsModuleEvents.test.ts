import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import type { Point as GeoJSONPoint } from 'geojson';
import type { TrafficIncidentsModuleFeature } from 'map';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getClickedTopFeature,
    getNumLeftAndRightClicks,
    getPixelCoords,
    initTrafficIncidents,
    waitForMapIdle,
} from './util/TestUtils';

const waitForShownIncidents = async (page: Page): Promise<TrafficIncidentsModuleFeature[]> => {
    await page.waitForFunction(
        () => {
            const shown = (globalThis as any).trafficIncidents?.getShown();
            return shown !== undefined && shown.trafficIncidents.length > 0;
        },
        undefined,
        { timeout: 20000 },
    );
    return page.evaluate(() => (globalThis as any).trafficIncidents?.getShown()?.trafficIncidents ?? []);
};

const setupIncidentsClickHandler = async (page: Page) =>
    page.evaluate(() => {
        const mapsSdkThis = globalThis as MapsSDKThis;
        mapsSdkThis.trafficIncidents?.events.on('click', (feature) => {
            mapsSdkThis._numOfClicks++;
            mapsSdkThis._clickedTopFeature = feature;
        });
    });

const unsetIncidents = async (page: Page) =>
    page.evaluate(() => {
        (globalThis as MapsSDKThis).trafficIncidents = undefined;
    });

test.describe('Traffic incidents module events', () => {
    const mapEnv = new MapTestEnv();

    test.afterEach(async ({ page }) => unsetIncidents(page));

    test('Click on a traffic incident icon fires the click event with id and category on the feature', async ({
        page,
    }) => {
        // Central London — consistently high incident density across all traffic layers
        await mapEnv.loadPageAndMap(page, { zoom: 14, center: [-0.12621, 51.50394] });

        // visible: true sets all incident layers (including icon/symbol layers) to visible
        await initTrafficIncidents(page, { visible: true });
        await waitForMapIdle(page);

        const incidents = await waitForShownIncidents(page);
        expect(incidents.length).toBeGreaterThan(0);

        // Icon-backed features have Point geometry — pick the first one as a precise click target
        const iconIncident = incidents.find((f) => f.geometry.type === 'Point');
        expect(iconIncident).toBeDefined();
        const coordinates = (iconIncident?.geometry as GeoJSONPoint).coordinates as [number, number];
        const pixelCoords = await getPixelCoords(page, coordinates);

        await setupIncidentsClickHandler(page);
        await page.mouse.click(pixelCoords.x, pixelCoords.y);

        await page.waitForFunction(() => (globalThis as any)._numOfClicks > 0, undefined, { timeout: 5000 });
        expect(await getNumLeftAndRightClicks(page)).toEqual([1, 0]);

        const clickedFeature = await getClickedTopFeature<TrafficIncidentsModuleFeature>(page);
        expect(typeof clickedFeature.properties.id).toBe('string');
        expect(clickedFeature.properties.id.length).toBeGreaterThan(0);
        expect(typeof clickedFeature.properties.category).toBe('string');
        expect(clickedFeature.properties.category.length).toBeGreaterThan(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
