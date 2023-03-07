import { MapGeoJSONFeature } from "maplibre-gl";
import { FilterablePOICategory, getCategoryIcons, POI_SOURCE_ID, VectorTilePOIsFeature } from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import { Point } from "geojson";
import { getNumVisibleLayersBySource, waitForMapIdle, waitUntilRenderedFeaturesChange } from "./util/TestUtils";

const waitForRenderedPOIsChange = async (previousFeaturesCount: number): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeaturesChange(["POI"], previousFeaturesCount, 10000);

const areSomeIconsIncluded = (renderedPOIs: MapGeoJSONFeature[], filteredCategories: FilterablePOICategory[]) => {
    return renderedPOIs
        .map((poi) => poi.properties.icon)
        .some((poiIcon) => getCategoryIcons(filteredCategories).includes(poiIcon));
};

const areAllIconsIncluded = (renderedPOIs: MapGeoJSONFeature[], filteredCategories: FilterablePOICategory[]) => {
    return renderedPOIs
        .map((poi) => poi.properties.icon)
        .every((poiIcon) => getCategoryIcons(filteredCategories).includes(poiIcon));
};

describe("Map vector tile POI filtering tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Failing to initialize if excluded from the style", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394],
                zoom: 15
            },
            {
                exclude: ["poi"]
            }
        );

        await expect(
            page.evaluate(async () => {
                const goSDKThis = globalThis as GOSDKThis;
                await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap);
            })
        ).rejects.toBeDefined();
    });

    test("Vector tiles pois visibility changes in different ways", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });

        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap, { visible: false });
        });
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as GOSDKThis).pois?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as GOSDKThis).pois?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.resetConfig());
        expect(await page.evaluate(() => (globalThis as GOSDKThis).pois?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.applyConfig({ visible: false }));
        expect(await page.evaluate(() => (globalThis as GOSDKThis).pois?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.applyConfig({ visible: true }));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.applyConfig({ visible: false }));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.applyConfig({}));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.resetConfig());
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois filter starting with no config", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap);
        });
        await waitForMapIdle();
        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // exclude TRANSPORTATION_GROUP, IMPORTANT_TOURIST_ATTRACTION, expect to not find them in rendered features
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.filterCategories({
                show: "all_except",
                values: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(
            false
        );

        // change filter config to show "only" TRANSPORTATION_GROUP and expect all features to be from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.filterCategories({
                show: "only",
                values: ["TRANSPORTATION_GROUP"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        // resetting config:
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.resetConfig());
        await waitForMapIdle();

        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois filter while initializing with config", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        // config poi layer to only include TRANSPORTATION_GROUP categories and expect all features to be from TRANSPORTATION_GROUP
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap, {
                filters: {
                    categories: {
                        show: "only",
                        values: ["TRANSPORTATION_GROUP"]
                    }
                }
            });
        });
        await waitForMapIdle();

        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        // set filter to include only and expect all features to be from the included category values
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.filterCategories({
                show: "only",
                values: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // change filter settings to exclude TRANSPORTATION_GROUP and expect to not find any features from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.filterCategories({
                show: "all_except",
                values: ["TRANSPORTATION_GROUP"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        // setting visibility to false:
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setVisible(false));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs).toHaveLength(0);

        // re-setting config:
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.resetConfig());
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois filter with manual set filter before category filter", async () => {
        const existingFilter = [
            "any",
            // IMPORTANT_TOURIST_ATTRACTION
            ["==", ["get", "icon"], 154],
            // RAILROAD_STATION
            ["==", ["get", "icon"], 147]
        ];
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap);
        });

        // manually override existing POI layer filter to be able to verify it's combined with categories filter
        await page.evaluate(
            (inputExistingFilter) => (globalThis as GOSDKThis).mapLibreMap.setFilter("POI", inputExistingFilter),
            existingFilter
        );
        await page.evaluate(
            (inputExistingFilter) =>
                // overriding existing layerFilter with the applied filters only for test purposes
                // @ts-ignore
                ((globalThis as GOSDKThis).pois.originalFilter = inputExistingFilter),
            existingFilter
        );
        await waitForMapIdle();
        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areAllIconsIncluded(renderedPOIs, ["IMPORTANT_TOURIST_ATTRACTION", "RAILROAD_STATION"])).toBe(true);

        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.filterCategories({
                show: "all_except",
                values: ["IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["RAILROAD_STATION"])).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

describe("Map vector tile POI feature tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Ensure required feature properties are defined", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });

        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap);
        });
        await waitForMapIdle();

        const poiCoordinates = await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            const geometry = goSDKThis.mapLibreMap.queryRenderedFeatures({ layers: ["POI"] })[0].geometry as Point;
            return geometry.coordinates;
        });

        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois?.events.on("click", (lngLat, topFeature) => (goSDKThis._clickedTopFeature = topFeature));
        });

        const mapLibreCoordinates = await page.evaluate(
            (coordinates) => (globalThis as GOSDKThis).mapLibreMap.project(coordinates),
            poiCoordinates
        );

        await page.mouse.click(mapLibreCoordinates.x, mapLibreCoordinates.y);

        const clickedFeature = (await page.evaluate(
            async () => (globalThis as GOSDKThis)._clickedTopFeature
        )) as VectorTilePOIsFeature;

        expect(clickedFeature.properties.name).toBeDefined();
        expect(clickedFeature.properties.id).toBeDefined();
        expect(clickedFeature.properties.icon).toBeDefined();
        expect(clickedFeature.properties.category).toBeDefined();
        expect(clickedFeature.properties.category_id).toBeDefined();
        expect(clickedFeature.properties.priority).toBeDefined();
    });
});
