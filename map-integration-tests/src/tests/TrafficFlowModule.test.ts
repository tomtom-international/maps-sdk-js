import { MapGeoJSONFeature } from "maplibre-gl";
import { RoadCategory, TRAFFIC_FLOW_SOURCE_ID, FlowConfig, StyleModuleInitConfig, TrafficFlowFilters } from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import {
    getVisibleLayersBySource,
    setStyle,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeaturesChange
} from "./util/TestUtils";

const waitForRenderedFlowChange = async (previousFeaturesCount: number): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeaturesChange(
        (await getVisibleLayersBySource(TRAFFIC_FLOW_SOURCE_ID)).map((layer) => layer.id),
        previousFeaturesCount,
        10000
    );

const getByRoadCategories = (renderedItems: MapGeoJSONFeature[], roadCategories: RoadCategory[]): MapGeoJSONFeature[] =>
    renderedItems.filter((incident) => roadCategories.includes(incident.properties["road_category"]));

const initTrafficFlow = async (config?: StyleModuleInitConfig & FlowConfig) =>
    page.evaluate(async (inputConfig?) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.trafficFlow = await mapsSDKThis.MapsSDK.TrafficFlowModule.get(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

const unsetTrafficFlow = async () => page.evaluate(async () => ((globalThis as MapsSDKThis).trafficFlow = undefined));

const getConfig = async (): Promise<FlowConfig | undefined> =>
    page.evaluate(async () => (globalThis as MapsSDKThis).trafficFlow?.getConfig());

const applyConfig = async (config: FlowConfig | undefined) =>
    page.evaluate((inputConfig) => (globalThis as MapsSDKThis).trafficFlow?.applyConfig(inputConfig), config);

const resetConfig = async () => page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.resetConfig());

describe("Map vector tile traffic module tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());
    afterEach(async () => unsetTrafficFlow());

    test("Failing to initialize if fully excluded from the style", async () => {
        await mapEnv.loadMap({});
        await expect(initTrafficFlow()).rejects.toBeDefined();
    });

    test("Auto initialize if fully excluded from the style", async () => {
        await mapEnv.loadMap({});
        await initTrafficFlow({ ensureAddedToStyle: true });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow)).not.toBeNull();
    });

    test("Vector tiles traffic visibility changes in different ways", async () => {
        await mapEnv.loadMap(
            { zoom: 14, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["traffic_flow"] } }
        );
        expect(await getConfig()).toBeUndefined();

        await initTrafficFlow({ visible: false });
        expect(await getConfig()).toEqual({ visible: false });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        expect(await getConfig()).toEqual({ visible: true });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        expect(await getConfig()).toEqual({ visible: false });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();

        // re-applying config again:
        await applyConfig(await getConfig());
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();
        expect(await getConfig()).toEqual({
            visible: true
        });

        await applyConfig({ visible: undefined });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();

        await resetConfig();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();
        expect(await getConfig()).toBeUndefined();

        // changing the map style: verifying the places are still shown (state restoration):
        await setStyle("standardDark");
        await waitForMapIdle();
        await waitForTimeout(3000);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();

        await resetConfig();
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();
        expect(await getConfig()).toBeUndefined();

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Traffic flow filtering with initial config", async () => {
        await mapEnv.loadMap(
            { zoom: 12, center: [2.37327, 48.85903] },
            { style: { type: "published", include: ["traffic_flow"] } }
        );

        const config: FlowConfig = {
            filters: {
                any: [{ roadCategories: { show: "only", values: ["motorway"] }, showRoadClosures: "all_except" }]
            }
        };

        await initTrafficFlow(config);
        expect(await getConfig()).toEqual(config);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();
        await waitForMapIdle();
        const renderedFlowSegments = await waitForRenderedFlowChange(0);

        // We only show for: "motorway", "trunk":
        expect(getByRoadCategories(renderedFlowSegments, ["motorway"])).toHaveLength(renderedFlowSegments.length);
        expect(renderedFlowSegments.filter((segment) => segment.properties["road_closure"] === true)).toHaveLength(0);

        // Showing flow in road closures only:
        const flowFilters: TrafficFlowFilters = { any: [{ showRoadClosures: "only" }] };
        await page.evaluate(
            async (inputFlowFilters) => (globalThis as MapsSDKThis).trafficFlow?.filter(inputFlowFilters),
            flowFilters
        );
        expect(await getConfig()).toEqual({ filters: flowFilters });
        await waitForMapIdle();

        const renderedRoadClosures = await waitForRenderedFlowChange(renderedFlowSegments.length);
        expect(renderedRoadClosures.filter((segment) => segment.properties["road_closure"] === true)).toHaveLength(
            renderedRoadClosures.length
        );

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Traffic flow filtering with complex initial config", async () => {
        await mapEnv.loadMap(
            { zoom: 13, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["traffic_flow", "poi"] } }
        );

        const config: FlowConfig = {
            filters: {
                any: [
                    {
                        roadCategories: { show: "only", values: ["motorway", "trunk", "primary"] },
                        showRoadClosures: "all_except"
                    }
                ]
            }
        };

        await initTrafficFlow(config);
        expect(await getConfig()).toEqual(config);
        await waitForMapIdle();

        // FLOW assertions:
        let renderedFlowSegments = await waitForRenderedFlowChange(0);
        expect(renderedFlowSegments.length).toBeGreaterThan(5);

        // We only show for: "motorway", "trunk", "primary"
        expect(getByRoadCategories(renderedFlowSegments, ["motorway", "trunk", "primary"])).toHaveLength(
            renderedFlowSegments.length
        );
        expect(getByRoadCategories(renderedFlowSegments, ["secondary", "tertiary", "street"])).toHaveLength(0);

        // CHANGING THE MAP STYLE: verifying the config is still the same (state restoration):
        await setStyle("standardDark");
        await waitForMapIdle();
        await waitForTimeout(3000);
        expect(await getConfig()).toEqual(config);
        // FLOW assertions:
        renderedFlowSegments = await waitForRenderedFlowChange(0);
        expect(getByRoadCategories(renderedFlowSegments, ["motorway", "trunk", "primary"])).toHaveLength(
            renderedFlowSegments.length
        );
        expect(getByRoadCategories(renderedFlowSegments, ["secondary", "tertiary", "street"])).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // (We'll verify that using dedicated methods for filtering and visibility do not affect each other)
    test("Traffic visibility and filtering with dedicated methods", async () => {
        await mapEnv.loadMap(
            // London:
            { zoom: 12, center: [-0.12621, 51.50394] },
            { style: { type: "published", include: ["traffic_flow"] } }
        );

        await initTrafficFlow();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));

        const flowFilters: TrafficFlowFilters = { any: [{ roadCategories: { show: "only", values: ["primary"] } }] };
        // Showing flow in primary roads only:
        await page.evaluate(
            async (inputFlowFilters) => (globalThis as MapsSDKThis).trafficFlow?.filter(inputFlowFilters),
            flowFilters
        );
        expect(await getConfig()).toEqual({
            visible: false,
            filters: flowFilters
        });

        // (changing flow filter directly shouldn't affect flow visibility):
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeFalsy();
        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(true));
        expect(await getConfig()).toEqual({
            visible: true,
            filters: flowFilters
        });
        expect(await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.isVisible())).toBeTruthy();

        await page.evaluate(() => (globalThis as MapsSDKThis).trafficFlow?.setVisible(false));
        expect(await getConfig()).toEqual({
            visible: false,
            filters: flowFilters
        });

        await page.evaluate(async () => (globalThis as MapsSDKThis).trafficFlow?.filter());
        expect(await getConfig()).toEqual({
            visible: false
        });
    });
});
