import { FilterSpecification, LngLatLike, MapGeoJSONFeature } from "maplibre-gl";
import { FilterablePOICategory, getStyleCategories, poiLayerIDs, POIsModuleFeature } from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { Point } from "geojson";
import { getNumVisiblePOILayers, initPOIs, waitForMapIdle, waitUntilRenderedFeaturesChange } from "./util/TestUtils";

const waitForRenderedPOIsChange = async (previousFeaturesCount: number): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeaturesChange(["POI"], previousFeaturesCount, 10000);

const areSomeCategoriesIncluded = (renderedPOIs: MapGeoJSONFeature[], filteredCategories: FilterablePOICategory[]) =>
    renderedPOIs
        .map((poi) => poi.properties.category)
        .some((category) => getStyleCategories(filteredCategories).includes(category));

const areAllCategoriesIncluded = (renderedPOIs: MapGeoJSONFeature[], filteredCategories: FilterablePOICategory[]) =>
    renderedPOIs
        .map((poi) => poi.properties.category)
        .every((category) => getStyleCategories(filteredCategories).includes(category));

describe("Map vector tile POI filtering tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Vector tiles pois visibility changes in different ways", async () => {
        await mapEnv.loadMap({ zoom: 14, center: [-0.12621, 51.50394] });

        await initPOIs({ visible: false });
        expect(await getNumVisiblePOILayers()).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(true);
        expect(await getNumVisiblePOILayers()).toBe(poiLayerIDs.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(false);
        expect(await getNumVisiblePOILayers()).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(true);
        expect(await getNumVisiblePOILayers()).toBe(poiLayerIDs.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: false }));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).pois?.isVisible())).toBe(false);
        expect(await getNumVisiblePOILayers()).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: true }));
        expect(await getNumVisiblePOILayers()).toBe(poiLayerIDs.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({ visible: false }));
        expect(await getNumVisiblePOILayers()).toBe(0);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.applyConfig({}));
        expect(await getNumVisiblePOILayers()).toBe(poiLayerIDs.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        expect(await getNumVisiblePOILayers()).toBe(poiLayerIDs.length);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois filter starting with no config", async () => {
        await mapEnv.loadMap({ zoom: 16, center: [-0.12621, 51.50154] });
        await initPOIs();
        await waitForMapIdle();
        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areSomeCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(
            true
        );

        // exclude TRANSPORTATION_GROUP, IMPORTANT_TOURIST_ATTRACTION, expect to not find them in rendered features
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: "all_except",
                values: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areSomeCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(
            false
        );

        // change filter config to show "only" TRANSPORTATION_GROUP and expect all features to be from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({ show: "only", values: ["TRANSPORTATION_GROUP"] })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        // resetting config:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        await waitForMapIdle();

        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areSomeCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(
            true
        );
        expect(areAllCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois filter while initializing with config", async () => {
        await mapEnv.loadMap({ zoom: 16, center: [-0.12621, 51.50154] });
        // config poi layer to only include TRANSPORTATION_GROUP categories and expect all features to be from TRANSPORTATION_GROUP
        await initPOIs({ filters: { categories: { show: "only", values: ["TRANSPORTATION_GROUP"] } } });
        await waitForMapIdle();

        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        // set filter to include only and expect all features to be from the included category values
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: "only",
                values: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(
            true
        );

        // change filter settings to exclude TRANSPORTATION_GROUP and expect to not find any features from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: "all_except",
                values: ["TRANSPORTATION_GROUP"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areSomeCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        // setting visibility to false:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.setVisible(false));
        expect(await getNumVisiblePOILayers()).toBe(0);
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs).toHaveLength(0);

        // re-setting config:
        await page.evaluate(() => (globalThis as MapsSDKThis).pois?.resetConfig());
        expect(await getNumVisiblePOILayers()).toBe(poiLayerIDs.length);
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Vector tiles pois filter with manual set filter before category filter", async () => {
        const existingFilter: FilterSpecification = [
            "any",
            // IMPORTANT_TOURIST_ATTRACTION
            ["==", ["get", "category"], "tourist_attraction"],
            // RAILROAD_STATION
            ["==", ["get", "category"], "railway_station"]
        ];
        await mapEnv.loadMap({ zoom: 16, center: [-0.12621, 51.50154] });
        await initPOIs();

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
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPOIs, ["IMPORTANT_TOURIST_ATTRACTION", "RAILWAY_STATION"])).toBe(true);

        await page.evaluate(() =>
            (globalThis as MapsSDKThis).pois?.filterCategories({
                show: "all_except",
                values: ["IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForMapIdle();
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(renderedPOIs.length).toBeGreaterThan(0);
        expect(areAllCategoriesIncluded(renderedPOIs, ["RAILWAY_STATION"])).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

describe("Map vector tile POI feature tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Ensure required feature properties are defined", async () => {
        await mapEnv.loadMap({ zoom: 14, center: [-0.12621, 51.50394] });

        await initPOIs();
        await waitForMapIdle();

        const poiCoordinates: LngLatLike = await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            const geometry = mapsSDKThis.mapLibreMap.queryRenderedFeatures({ layers: ["POI"] })[0].geometry as Point;
            return geometry.coordinates as LngLatLike;
        });

        const pixelCoordinates = await page.evaluate(
            (coordinates) => (globalThis as MapsSDKThis).mapLibreMap.project(coordinates),
            poiCoordinates
        );

        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.pois?.events.on("click", (topFeature) => (mapsSDKThis._clickedTopFeature = topFeature));
        });

        await page.mouse.click(pixelCoordinates.x, pixelCoordinates.y);

        const clickedFeature = (await page.evaluate(
            async () => (globalThis as MapsSDKThis)._clickedTopFeature
        )) as POIsModuleFeature;

        expect(clickedFeature.properties.id).toBeDefined();
        expect(clickedFeature.properties.name).toBeDefined();
        expect(clickedFeature.properties.category).toBeDefined();
        expect(clickedFeature.properties.group).toBeDefined();
        expect(clickedFeature.properties.priority).toBeDefined();
    });
});
