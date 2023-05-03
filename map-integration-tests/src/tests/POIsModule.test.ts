import { MapGeoJSONFeature } from "maplibre-gl";
import {
    FilterablePOICategory,
    getCategoryIcons,
    HILLSHADE_SOURCE_ID,
    POI_SOURCE_ID,
    POIsModuleFeature,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID
} from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { Point } from "geojson";
import {
    getNumVisibleLayersBySource,
    waitForMapIdle,
    waitForMapReady,
    waitUntilRenderedFeaturesChange
} from "./util/TestUtils";

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
        await mapEnv.loadMap({});
        await expect(
            page.evaluate(async () => {
                const mapsSDKThis = globalThis as MapsSDKThis;
                await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap);
            })
        ).rejects.toBeDefined();
    });

    test("Success to initialize if not included in the style, but auto adding it", async () => {
        await mapEnv.loadMap({ center: [7.12621, 48.50394], zoom: 8 });

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, { ensureAddedToStyle: true });
        });

        await waitForMapReady();
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(TRAFFIC_INCIDENTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(TRAFFIC_FLOW_SOURCE_ID)).toBe(0);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Success to initialize if not included in the style, but auto adding it, invisible upfront", async () => {
        await mapEnv.loadMap({ center: [7.12621, 48.50394], zoom: 8 });

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.pois = await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, {
                ensureAddedToStyle: true,
                visible: false
            });
        });

        await waitForMapReady();
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(true));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBeGreaterThan(0);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois visibility changes in different ways", async () => {
        await mapEnv.loadMap(
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["poi"] } }
        );

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.pois = await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, { visible: false });
        });
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(true);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: false }));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(false);
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: true }));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: false }));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({}));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois filter starting with no config", async () => {
        await mapEnv.loadMap(
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["poi"] } }
        );
        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.pois = await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap);
        });
        await waitForMapIdle();
        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // exclude TRANSPORTATION_GROUP, IMPORTANT_TOURIST_ATTRACTION, expect to not find them in rendered features
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
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
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: "only",
                values: ["TRANSPORTATION_GROUP"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        // resetting config:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        await waitForMapIdle();

        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois filter while initializing with config", async () => {
        await mapEnv.loadMap(
            {
                zoom: 14,
                center: [-0.12621, 51.50394]
            },
            {
                style: { type: "published", include: ["poi"] }
            }
        );
        // config poi layer to only include TRANSPORTATION_GROUP categories and expect all features to be from TRANSPORTATION_GROUP
        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.pois = await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, {
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
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: "only",
                values: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // change filter settings to exclude TRANSPORTATION_GROUP and expect to not find any features from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: "all_except",
                values: ["TRANSPORTATION_GROUP"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        // setting visibility to false:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBe(0);
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs).toHaveLength(0);

        // re-setting config:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
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
        await mapEnv.loadMap(
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["poi"] } }
        );
        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.pois = await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap, {
                ensureAddedToStyle: true
            });
        });

        // manually override existing POI layer filter to be able to verify it's combined with categories filter
        await page.evaluate(
            (inputExistingFilter) => (globalThis as MapsSDKThis).mapLibreMap.setFilter("POI", inputExistingFilter),
            existingFilter
        );
        await page.evaluate(
            (inputExistingFilter) =>
                // overriding existing layerFilter with the applied filters only for test purposes
                // @ts-ignore
                ((globalThis as MapsSDKThis).pois.originalFilter = inputExistingFilter),
            existingFilter
        );
        await waitForMapIdle();
        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areAllIconsIncluded(renderedPOIs, ["IMPORTANT_TOURIST_ATTRACTION", "RAILROAD_STATION"])).toBe(true);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
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
        await mapEnv.loadMap(
            {
                zoom: 14,
                center: [-0.12621, 51.50394]
            },
            {
                style: { type: "published", include: ["poi"] }
            }
        );

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.pois = await mapsSDKThis.MapsSDK.POIsModule.get(mapsSDKThis.tomtomMap);
        });
        await waitForMapIdle();

        const poiCoordinates = await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            const geometry = mapsSDKThis.mapLibreMap.queryRenderedFeatures({ layers: ["POI"] })[0].geometry as Point;
            return geometry.coordinates;
        });

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.pois?.events.on("click", (topFeature) => (mapsSDKThis._clickedTopFeature = topFeature));
        });

        const mapLibreCoordinates = await page.evaluate(
            (coordinates) => (globalThis as MapsSDKThis).mapLibreMap.project(coordinates),
            poiCoordinates
        );

        await page.mouse.click(mapLibreCoordinates.x, mapLibreCoordinates.y);

        const clickedFeature = (await page.evaluate(
            async () => (globalThis as MapsSDKThis)._clickedTopFeature
        )) as POIsModuleFeature;

        expect(clickedFeature.properties.name).toBeDefined();
        expect(clickedFeature.properties.icon).toBeDefined();
        expect(clickedFeature.properties.category).toBeDefined();
        expect(clickedFeature.properties.category_id).toBeDefined();
        expect(clickedFeature.properties.priority).toBeDefined();
    });
});
