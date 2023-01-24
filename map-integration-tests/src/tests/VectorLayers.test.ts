import { MapGeoJSONFeature } from "maplibre-gl";
import {
    getNumVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapStyleToLoad,
    waitForAnyRenderedFeatures
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

    const waitForRenderedPOIs = async () => await waitForAnyRenderedFeatures(["POI"], 20000);
    const areSomeIconsIncluded = (renderedPOIs: MapGeoJSONFeature[], filteredCategories: FilteredPOICategories) => {
        return renderedPOIs
            .map((poi) => poi.properties.icon)
            .some((POIIcon) => getCategoryIcons(filteredCategories).includes(POIIcon));
    };
    const areAllIconsIncluded = (renderedPOIs: MapGeoJSONFeature[], filteredCategories: FilteredPOICategories) => {
        return renderedPOIs
            .map((poi) => poi.properties.icon)
            .every((POIIcon) => getCategoryIcons(filteredCategories).includes(POIIcon));
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
        await waitForMapStyleToLoad();
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
        await waitForMapStyleToLoad();
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
        let renderedPOIs = await waitForRenderedPOIs();
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.removeCategoriesFilter(["RESTAURANT"]));
        expect(mapEnv.consoleErrors).toHaveLength(1);

        // exclude TRANSPORTATION_GROUP, IMPORTANT_TOURIST_ATTRACTION expect to not find them in rendered features
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.addCategoriesFilter([
                "TRANSPORTATION_GROUP",
                "IMPORTANT_TOURIST_ATTRACTION"
            ])
        );
        renderedPOIs = await waitForRenderedPOIs();
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(
            false
        );

        // remove IMPORTANT_TOURIST_ATTRACTION filter and expect to find it in rendered features
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.removeCategoriesFilter(["IMPORTANT_TOURIST_ATTRACTION"])
        );
        renderedPOIs = await waitForRenderedPOIs();
        expect(areSomeIconsIncluded(renderedPOIs, ["IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // change filter mode to "include" and expect all features to be from TRANSPORTATION_GROUP
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setCategoriesFilterMode("include"));
        renderedPOIs = await waitForRenderedPOIs();
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        // add GOVERNMENT_OFFICE filter and expect all features to be from TRANSPORTATION_GROUP or GOVERNMENT_OFFICE
        await page.evaluate(() => (globalThis as GOSDKThis).pois?.addCategoriesFilter(["GOVERNMENT_OFFICE"]));
        renderedPOIs = await waitForRenderedPOIs();
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "GOVERNMENT_OFFICE"])).toBe(true);
    });

    test("Vector tiles pois filter while initializing with config", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap, {
                categoriesFilter: {
                    mode: "include",
                    categories: ["TRANSPORTATION_GROUP"]
                }
            });
        });
        await waitForMapStyleToLoad();
        let renderedPOIs = await waitForRenderedPOIs();
        console.log(
            "renderedPOIs",
            renderedPOIs.map((poi) => poi.properties.icon)
        );
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.addCategoriesFilter(["IMPORTANT_TOURIST_ATTRACTION"])
        );
        renderedPOIs = await waitForRenderedPOIs();
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.removeCategoriesFilter(["IMPORTANT_TOURIST_ATTRACTION"])
        );
        renderedPOIs = await waitForRenderedPOIs();
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        await page.evaluate(() => (globalThis as GOSDKThis).pois?.setCategoriesFilterMode("exclude"));
        renderedPOIs = await waitForRenderedPOIs();
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);
    });

    test("Vector tiles pois filter with manual set filter before category filter", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap);
        });
        await waitForMapStyleToLoad();
        // manually override existing POI layer filter to be able to verify it's combined with categories filter
        await page.evaluate(() =>
            (globalThis as GOSDKThis).mapLibreMap.setFilter("POI", [
                "any",
                //IMPORTANT_TOURIST_ATTRACTION
                ["==", ["get", "icon"], 154],
                //RAILROAD_STATION
                ["==", ["get", "icon"], 147]
            ])
        );
        await page.evaluate(
            () =>
                // overriding existing layerFilter with the applied filters only for test purposes
                //@ts-ignore
                ((globalThis as GOSDKThis).pois.layerFilter = [
                    "any",
                    //IMPORTANT_TOURIST_ATTRACTION
                    ["==", ["get", "icon"], 154],
                    //RAILROAD_STATION
                    ["==", ["get", "icon"], 147]
                ])
        );
        let renderedPOIs = await waitForRenderedPOIs();
        expect(areAllIconsIncluded(renderedPOIs, ["IMPORTANT_TOURIST_ATTRACTION", "RAILROAD_STATION"])).toBe(true);

        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.addCategoriesFilter(["IMPORTANT_TOURIST_ATTRACTION"])
        );
        renderedPOIs = await waitForRenderedPOIs();
        expect(areAllIconsIncluded(renderedPOIs, ["RAILROAD_STATION"])).toBe(true);
    });
});
