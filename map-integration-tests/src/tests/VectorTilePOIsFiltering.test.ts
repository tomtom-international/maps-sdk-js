import { MapGeoJSONFeature } from "maplibre-gl";
import { FilterablePOICategory, getCategoryIcons } from "map";
import { MapIntegrationTestEnv, waitForTimeout, waitUntilRenderedFeaturesChange } from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";

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

    test("Vector tiles pois filter starting with no config", async () => {
        await mapEnv.loadMap({
            zoom: 14,
            center: [-0.12621, 51.50394]
        });
        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap);
        });
        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // exclude TRANSPORTATION_GROUP, IMPORTANT_TOURIST_ATTRACTION, expect to not find them in rendered features
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.applyCategoriesFilter({
                show: "all_except",
                values: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        await waitForTimeout(3000);
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(
            false
        );

        // change filter config to show "only" TRANSPORTATION_GROUP and expect all features to be from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.applyCategoriesFilter({
                show: "only",
                values: ["TRANSPORTATION_GROUP"]
            })
        );
        await waitForTimeout(3000);
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

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
        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(true);

        // set filter to include only and expect all features to be from the included category values
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.applyCategoriesFilter({
                show: "only",
                values: ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP", "IMPORTANT_TOURIST_ATTRACTION"])).toBe(true);

        // change filter settings to exclude TRANSPORTATION_GROUP and expect to not find any features from TRANSPORTATION_GROUP
        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.applyCategoriesFilter({
                show: "all_except",
                values: ["TRANSPORTATION_GROUP"]
            })
        );
        await waitForTimeout(3000);
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areSomeIconsIncluded(renderedPOIs, ["TRANSPORTATION_GROUP"])).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
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
                ((globalThis as GOSDKThis).pois.originalFilter = inputExistingFilter),
            existingFilter
        );
        await waitForTimeout(3000);
        let renderedPOIs = await waitForRenderedPOIsChange(0);
        expect(areAllIconsIncluded(renderedPOIs, ["IMPORTANT_TOURIST_ATTRACTION", "RAILROAD_STATION"])).toBe(true);

        await page.evaluate(() =>
            (globalThis as GOSDKThis).pois?.applyCategoriesFilter({
                show: "all_except",
                values: ["IMPORTANT_TOURIST_ATTRACTION"]
            })
        );
        renderedPOIs = await waitForRenderedPOIsChange(renderedPOIs.length);
        expect(areAllIconsIncluded(renderedPOIs, ["RAILROAD_STATION"])).toBe(true);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
