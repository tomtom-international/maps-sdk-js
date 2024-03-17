import type { MapGeoJSONFeature } from "maplibre-gl";
import { indexedMagnitudes } from "@anw/maps-sdk-js/core";
import type { IncidentCategory, RoadCategory, IncidentsConfig, TrafficIncidentsFilters } from "map";
import {
    incidentCategories as availableIncidentCategories,
    incidentCategoriesMapping,
    TRAFFIC_INCIDENTS_SOURCE_ID
} from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import type { MapsSDKThis } from "./types/MapsSDKThis";
import {
    getVisibleLayersBySource,
    initTrafficIncidents,
    setStyle,
    waitForMapIdle,
    waitUntilRenderedFeaturesChange
} from "./util/TestUtils";

const waitForRenderedIncidentsChange = async (previousFeaturesCount: number): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeaturesChange(
        (await getVisibleLayersBySource(TRAFFIC_INCIDENTS_SOURCE_ID)).map((layer) => layer.id),
        previousFeaturesCount,
        20000
    );

const mapIncidentCategories = (categories: IncidentCategory[]): number[] =>
    categories.map((category) => incidentCategoriesMapping[category]);

const getByIncidentCategories = (
    renderedIncidents: MapGeoJSONFeature[],
    incidentCategories: IncidentCategory[]
): MapGeoJSONFeature[] =>
    renderedIncidents.filter((incident) =>
        mapIncidentCategories(incidentCategories).includes(incident.properties["icon_category_0"])
    );

const getByRoadCategories = (renderedItems: MapGeoJSONFeature[], roadCategories: RoadCategory[]): MapGeoJSONFeature[] =>
    renderedItems.filter((incident) => roadCategories.includes(incident.properties["road_category"]));

const getConfig = async (): Promise<IncidentsConfig | undefined> =>
    page.evaluate(async () => (globalThis as MapsSDKThis).trafficIncidents?.getConfig());

const applyConfig = async (config: IncidentsConfig | undefined) =>
    page.evaluate((inputConfig) => (globalThis as MapsSDKThis).trafficIncidents?.applyConfig(inputConfig), config);

const unsetIncidents = async () =>
    page.evaluate(async () => ((globalThis as MapsSDKThis).trafficIncidents = undefined));

const resetConfig = async () => page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.resetConfig());

describe("Map vector tile traffic incidents module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());
    afterEach(async () => unsetIncidents());

    test("Failing to initialize if fully excluded from the style", async () => {
        await mapEnv.loadMap({});
        await expect(initTrafficIncidents()).rejects.toBeDefined();
    });

    test("Auto initialize if fully excluded from the style", async () => {
        await mapEnv.loadMap({});
        await initTrafficIncidents({ ensureAddedToStyle: true });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents)).not.toBeNull();
    });

    test("Vector tiles traffic incidents visibility changes in different ways", async () => {
        await mapEnv.loadMap(
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["trafficIncidents"] } }
        );
        expect(await getConfig()).toBeUndefined();

        await initTrafficIncidents({ visible: false });
        expect(await getConfig()).toEqual({ visible: false });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        expect(await getConfig()).toEqual({ visible: true });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));
        expect(await getConfig()).toEqual({ visible: false });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(true));
        expect(await getConfig()).toEqual({ visible: false, icons: { visible: true } });
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())
        ).toBeTruthy();

        // re-applying config again:
        await applyConfig(await getConfig());
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())
        ).toBeTruthy();
        expect(await getConfig()).toEqual({ visible: false, icons: { visible: true } });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeFalsy();
        expect(await getConfig()).toEqual({ visible: false });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(false));
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())
        ).toBeFalsy();

        expect(await getConfig()).toEqual({
            visible: false,
            icons: { visible: false }
        });

        await applyConfig({ visible: undefined });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();

        await applyConfig({ visible: true });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(await getConfig()).toEqual({ visible: true });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setIconsVisible(false));
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())
        ).toBeFalsy();
        expect(await getConfig()).toEqual({ visible: true, icons: { visible: false } });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())
        ).toBeTruthy();
        expect(await getConfig()).toEqual({ visible: true });

        await resetConfig();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(await getConfig()).toBeUndefined();

        // changing the map style: verifying the places are still shown (state restoration):
        await setStyle("standardDark");
        await waitForMapIdle();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();

        await resetConfig();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(await getConfig()).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Traffic incidents filtering with config changes", async () => {
        await mapEnv.loadMap(
            { zoom: 13, center: [-0.12621, 51.50394] }, // London
            { style: { type: "published", include: ["trafficIncidents"] } }
        );
        await initTrafficIncidents();
        expect(await getConfig()).toBeUndefined();
        await waitForMapIdle();

        const defaultIncidents = await waitForRenderedIncidentsChange(0);
        expect(defaultIncidents.length).toBeGreaterThan(4);
        expect(getByIncidentCategories(defaultIncidents, ["road_closed"]).length).toBeGreaterThan(0);

        let config: IncidentsConfig = {
            filters: { any: [{ incidentCategories: { show: "only", values: ["road_closed"] } }] }
        };

        // Showing road closures only:
        await applyConfig(config);
        expect(await getConfig()).toEqual(config);

        // changing the map style (and manually adding also poi part):
        // verifying the config is still the same (state restoration):
        await setStyle({ type: "published", id: "standardDark", include: ["trafficIncidents"] });
        await waitForMapIdle();
        expect(await getConfig()).toEqual(config);

        const roadClosedIncidents = await waitForRenderedIncidentsChange(defaultIncidents.length);
        // we check that all the rendered incidents are of road_closed category:
        expect(getByIncidentCategories(roadClosedIncidents, ["road_closed"])).toHaveLength(roadClosedIncidents.length);
        expect(
            getByIncidentCategories(
                roadClosedIncidents,
                availableIncidentCategories.filter((category) => category != "road_closed")
            )
        ).toHaveLength(0);

        config = {
            filters: {
                any: [
                    { incidentCategories: { show: "only", values: ["road_closed"] } },
                    { roadCategories: { show: "only", values: ["motorway", "trunk", "primary"] } }
                ]
            }
        };

        // Changing filter to show road closures and major roads:
        await applyConfig(config);
        expect(await getConfig()).toEqual(config);

        // changing the map style: verifying the config is still the same (state restoration):
        await setStyle("monoLight");
        await waitForMapIdle();
        expect(await getConfig()).toEqual(config);

        const roadClosedAndMajorRoadIncidents = await waitForRenderedIncidentsChange(defaultIncidents.length);
        expect(roadClosedAndMajorRoadIncidents.length).toBeLessThan(defaultIncidents.length);
        // The addition of major road and road_closed incidents should be greater or equal than the total
        // (since there can be overlap due to the "any"/"or" filter)
        expect(
            getByRoadCategories(roadClosedAndMajorRoadIncidents, ["motorway", "trunk", "primary"]).length +
                getByIncidentCategories(roadClosedAndMajorRoadIncidents, ["road_closed"]).length
        ).toBeGreaterThanOrEqual(roadClosedAndMajorRoadIncidents.length);

        // We reset the config and assert that we have the same amount of incidents as the beginning:
        await resetConfig();
        const resetIncidents = await waitForRenderedIncidentsChange(roadClosedAndMajorRoadIncidents.length);
        expect(resetIncidents).toHaveLength(defaultIncidents.length);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Traffic incidents filtering with complex initial config", async () => {
        await mapEnv.loadMap(
            { zoom: 13, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["trafficIncidents"] } }
        );

        const config: IncidentsConfig = {
            filters: {
                any: [
                    {
                        magnitudes: { show: "only", values: ["moderate", "major"] },
                        delays: { minDelayMinutes: 5 }
                    },
                    { incidentCategories: { show: "only", values: ["road_closed"] } }
                ]
            }
        };

        await initTrafficIncidents(config);
        expect(await getConfig()).toEqual(config);
        await waitForMapIdle();

        // INCIDENTS assertions:
        let renderedIncidents = await waitForRenderedIncidentsChange(0);
        expect(renderedIncidents.length).toBeGreaterThan(5);

        // There should be no incidents that have delays, and such delays are less than 5 min:
        expect(
            renderedIncidents.filter((incident) => incident.properties.delay && incident.properties.delay < 300)
        ).toHaveLength(0);

        expect(getByIncidentCategories(renderedIncidents, ["road_closed"]).length).toBeGreaterThan(0);

        // We only allow for moderate, major and indefinite (because of road closures) magnitudes:
        expect(
            renderedIncidents.filter((incident) =>
                [indexedMagnitudes.indexOf("unknown"), indexedMagnitudes.indexOf("minor")].includes(
                    incident.properties.magnitude
                )
            )
        ).toHaveLength(0);

        // CHANGING THE MAP STYLE: verifying the config is still the same (state restoration):
        await setStyle({ type: "published", id: "standardDark", include: ["trafficIncidents"] });
        await waitForMapIdle();
        expect(await getConfig()).toEqual(config);

        // Asserting similar things again:
        // INCIDENTS assertions:
        renderedIncidents = await waitForRenderedIncidentsChange(0);
        expect(
            renderedIncidents.filter((incident) => incident.properties.delay && incident.properties.delay < 300)
        ).toHaveLength(0);
        expect(getByIncidentCategories(renderedIncidents, ["road_closed"]).length).toBeGreaterThan(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // (We'll verify that using dedicated methods for filtering and visibility do not affect each other)
    test("Traffic visibility and filtering with dedicated methods", async () => {
        await mapEnv.loadMap(
            // London:
            { zoom: 12, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["trafficIncidents"] } }
        );

        await initTrafficIncidents();

        const incidentFilters: TrafficIncidentsFilters = {
            any: [{ incidentCategories: { show: "only", values: ["road_closed"] } }]
        };
        // Showing road closures only:
        await page.evaluate(
            async (inputIncidentFilters) => (globalThis as MapsSDKThis).trafficIncidents?.filter(inputIncidentFilters),
            incidentFilters
        );
        expect(await getConfig()).toEqual({
            filters: incidentFilters,
            icons: {}
        });
        // (changing incidents filter directly shouldn't affect flow visibility):
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.isVisible())).toBeTruthy();
        expect(
            await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.anyIconLayersVisible())
        ).toBeTruthy();
        await waitForMapIdle();
        const roadClosedIncidents = await waitForRenderedIncidentsChange(0);
        // we check that all the rendered incidents are of road_closed category:
        expect(getByIncidentCategories(roadClosedIncidents, ["road_closed"])).toHaveLength(roadClosedIncidents.length);

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(false));
        expect(await getConfig()).toEqual({
            visible: false,
            filters: incidentFilters,
            icons: {}
        });

        await page.evaluate(
            async (inputIncidentFilters) =>
                (globalThis as MapsSDKThis).trafficIncidents?.filter(inputIncidentFilters, inputIncidentFilters),
            incidentFilters
        );
        expect(await getConfig()).toEqual({
            visible: false,
            filters: incidentFilters,
            icons: { filters: incidentFilters }
        });

        await page.evaluate(
            async (inputIncidentFilters) => (globalThis as MapsSDKThis).trafficIncidents?.filter(inputIncidentFilters),
            incidentFilters
        );
        expect(await getConfig()).toEqual({
            visible: false,
            filters: incidentFilters,
            icons: {}
        });

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficIncidents?.setVisible(true));
        expect(await getConfig()).toEqual({
            visible: true,
            filters: incidentFilters,
            icons: {}
        });
    });
});
