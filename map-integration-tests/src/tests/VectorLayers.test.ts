import { MapGeoJSONFeature } from "maplibre-gl";
import {
    getNumVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapReady,
    waitUntilRenderedFeaturesChange,
    waitForTimeout
} from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import { getCategoryIcons, FilteredPOICategories } from "map";

describe("Map vector layer tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    const assertNumLayers = (numLayers: number, positiveVsZero: boolean) => {
        if (positiveVsZero) {
            expect(numLayers).toBeGreaterThan(0);
        } else {
            expect(numLayers).toStrictEqual(0);
        }
    };

    const assertTrafficVisibility = async (incidentsVisible: boolean, flowVisible: boolean) => {
        assertNumLayers(await getNumVisibleLayersBySource("vectorTilesIncidents"), incidentsVisible);
        assertNumLayers(await getNumVisibleLayersBySource("vectorTilesFlow"), flowVisible);
    };

    const assertPOIsVisibility = async (poisVisible: boolean) =>
        assertNumLayers(await getNumVisibleLayersBySource("poiTiles"), poisVisible);

    const assertHillshadeVisibility = async (hillshadeVisible: boolean) =>
        assertNumLayers(await getNumVisibleLayersBySource("hillshade"), hillshadeVisible);

    const toggleVisibility = async () => {
        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.toggleVisibility());
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.toggleVisibility());
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.toggleVisibility());
    };

    const waitForRenderedPOIs = async (previousFeaturesCount: number) =>
        waitUntilRenderedFeaturesChange(["POI"], previousFeaturesCount, 20000);

    const areSomeIconsIncluded = (renderedPOIs: MapGeoJSONFeature[], filteredCategories: FilteredPOICategories) => {
        return renderedPOIs
            .map((poi) => poi.properties.icon)
            .some((poiIcon) => getCategoryIcons(filteredCategories).includes(poiIcon));
    };

    const areAllIconsIncluded = (renderedPOIs: MapGeoJSONFeature[], filteredCategories: FilteredPOICategories) => {
        return renderedPOIs
            .map((poi) => poi.properties.icon)
            .every((poiIcon) => getCategoryIcons(filteredCategories).includes(poiIcon));
    };

    // eslint-disable-next-line jest/expect-expect
    test("Vector tiles traffic/pois/hillshade visibility", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = await goSDKThis.GOSDK.VectorTilesTraffic.init(goSDKThis.goSDKMap, { visible: false });
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap, { visible: false });
            goSDKThis.hillshade = await goSDKThis.GOSDK.VectorTilesHillshade.init(goSDKThis.goSDKMap, {
                visible: false
            });
        });
        await waitForMapReady();
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setVisible(true));
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setVisible(true));
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.setVisible(true));
        await assertTrafficVisibility(true, true);
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setVisible(false));
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setVisible(false));
        await page.evaluate(() => (globalThis as GOSDKThis).hillshade?.setVisible(false));
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.setVisible(true));
        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.toggleIncidentsVisibility());
        await assertTrafficVisibility(false, true);

        await page.evaluate(() => (globalThis as GOSDKThis).traffic?.toggleFlowVisibility());
        await assertTrafficVisibility(false, false);

        await toggleVisibility();
        await assertTrafficVisibility(true, true);
        await assertPOIsVisibility(true);
        await assertHillshadeVisibility(true);

        await toggleVisibility();
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // eslint-disable-next-line jest/expect-expect
    test("Vector tiles traffic/pois/hillshade visibility with setVisible before waiting for map to load", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = (await goSDKThis.GOSDK.VectorTilesTraffic.init(goSDKThis.goSDKMap)).setVisible(false);
            goSDKThis.pois = (await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap)).setVisible(false);
            goSDKThis.hillshade = (await goSDKThis.GOSDK.VectorTilesHillshade.init(goSDKThis.goSDKMap)).setVisible(
                false
            );
        });
        await waitForMapReady();
        await assertTrafficVisibility(false, false);
        await assertPOIsVisibility(false);
        await assertHillshadeVisibility(false);

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
        let renderedPOIs = await waitForRenderedPOIs(0);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // exclude TRANSPORTATION_GROUP, IMPORTANT_TOURIST_ATTRACTION expect to not find them in rendered features
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.setCategoriesFilter({
                show: "all_except",
                categories: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForTimeout(3000);
        renderedPOIs = await waitForRenderedPOIs(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(
            false
        );

        // change the filter to include IMPORTANT_TOURIST_ATTRACTION again and expect to find it in rendered features
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.setCategoriesFilter({
                show: "all_except",
                categories: ["TRANSPORTATION_GROUP"]
            })
        );
        renderedPOIs = await waitForRenderedPOIs(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // change filter show mode to "only" and expect all features to be from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.setCategoriesFilter({
                show: "only",
                categories: ["TRANSPORTATION_GROUP"]
            })
        );
        renderedPOIs = await waitForRenderedPOIs(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);
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
                categoriesFilter: {
                    show: "only",
                    categories: ["TRANSPORTATION_GROUP"]
                }
            });
        });
        let renderedPOIs = await waitForRenderedPOIs(0);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        // add IMPORTANT_TOURIST_ATTRACTION filter and expect all features to be from TRANSPORTATION_GROUP or IMPORTANT_TOURIST_ATTRACTION
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.setCategoriesFilter({
                show: "only",
                categories: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        renderedPOIs = await waitForRenderedPOIs(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // change filter show mode and  expect to not find any features from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.setCategoriesFilter({
                show: "all_except",
                categories: ["TRANSPORTATION_GROUP"]
            })
        );
        renderedPOIs = await waitForRenderedPOIs(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);
    });

    test("Vector tiles pois filter with manual set filter before category filter", async () => {
        const existingFilter = [
            "any",
            //IMPORTANT_TOURIST_ATTRACTION
            ["==", ["get", "icon"], 154],
            //RAILROAD_STATION
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
                //@ts-ignore
                ((globalThis as GOSDKThis).pois.layerFilter = inputExistingFilter),
            existingFilter
        );
        await waitForTimeout(3000);
        let renderedPOIs = await waitForRenderedPOIs(0);
        expect(areAllIconsIncluded(renderedPOIs, ["IMPORTANT_TOURIST_ATTRACTION", "RAILROAD_STATION"])).toBe(true);

        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.setCategoriesFilter({
                show: "all_except",
                categories: ["IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        renderedPOIs = await waitForRenderedPOIs(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["RAILROAD_STATION"])).toBe(true);
    });
});
