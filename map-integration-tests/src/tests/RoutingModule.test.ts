import {
    defaultRouteLayersConfig,
    HILLSHADE_SOURCE_ID,
    ROUTE_DESELECTED_LINE_LAYER_ID,
    ROUTE_EV_CHARGING_STATIONS_SOURCE_ID,
    ROUTE_EV_CHARGING_STATIONS_SYMBOL_LAYER_ID,
    ROUTE_FERRIES_LINE_LAYER_ID,
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_INCIDENTS_SYMBOL_LAYER_ID,
    ROUTE_INSTRUCTIONS_ARROW_LAYER_ID,
    ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID,
    ROUTE_INSTRUCTIONS_LINE_LAYER_ID,
    ROUTE_INSTRUCTIONS_SOURCE_ID,
    ROUTE_LINE_LAYER_ID,
    ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID,
    ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID,
    ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID,
    ROUTE_TOLL_ROADS_SOURCE_ID,
    ROUTE_TUNNELS_SOURCE_ID,
    ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID,
    ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
    ROUTES_SOURCE_ID,
    RoutingModuleConfig,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID,
    WAYPOINT_SYMBOLS_LAYER_ID,
    WAYPOINTS_SOURCE_ID
} from "map";
import { Routes, WaypointLike } from "@anw/maps-sdk-js/core";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import rotterdamToAmsterdamRoutesJSON from "./data/RoutingModuleRotterdamToAmsterdamNoInstructions.test.data.json";
import ldevrTestRoutesJSON from "./data/RoutingModuleLDEVR.test.data.json";

import {
    getNumVisibleLayersBySource,
    getPaintProperty,
    initHillshade,
    queryRenderedFeatures,
    setStyle,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures,
    waitUntilRenderedFeaturesChange
} from "./util/TestUtils";

const initRouting = async (config?: RoutingModuleConfig) =>
    page.evaluate(async (inputConfig?: RoutingModuleConfig) => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.routing = await mapsSDKThis.MapsSDK.RoutingModule.init(mapsSDKThis.tomtomMap, inputConfig);
    }, config);

const applyConfig = async (config: RoutingModuleConfig) =>
    page.evaluate((inputConfig: RoutingModuleConfig) => {
        (globalThis as MapsSDKThis).routing?.applyConfig(inputConfig);
    }, config);

const showRoutes = async (routes: Routes) =>
    page.evaluate((inputRoutes: Routes) => {
        (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes);
    }, routes);

const selectRoute = async (index: number) =>
    page.evaluate((inputIndex: number) => {
        (globalThis as MapsSDKThis).routing?.selectRoute(inputIndex);
    }, index);

const clearRoutes = async () => page.evaluate(() => (globalThis as MapsSDKThis).routing?.clearRoutes());

const showWaypoints = async (waypoints: WaypointLike[]) =>
    page.evaluate((inputWaypoints) => {
        (globalThis as MapsSDKThis).routing?.showWaypoints(inputWaypoints);
    }, waypoints);

const clearWaypoints = async () => page.evaluate(() => (globalThis as MapsSDKThis).routing?.clearWaypoints());

const waitForRenderedWaypoints = async (numWaypoint: number) =>
    waitUntilRenderedFeatures([WAYPOINT_SYMBOLS_LAYER_ID], numWaypoint, 5000);

const getSelectedSummaryBubbleProps = async (): Promise<any | undefined> => {
    const renderedBubbles = await queryRenderedFeatures([ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID]);
    return renderedBubbles.find((f) => f.properties?.routeStyle == "selected")?.properties;
};

// (We reparse the route because it contains Date objects):
const amsterdamToRotterdamRoutes = JSON.parse(JSON.stringify(rotterdamToAmsterdamRoutesJSON));
const ldevrTestRoutes = JSON.parse(JSON.stringify(ldevrTestRoutesJSON));

const NUM_WAYPOINT_LAYERS = 2;
const NUM_ROUTE_LAYERS = 4;
const NUM_VEHICLE_RESTRICTED_LAYERS = 2;
const NUM_INCIDENT_LAYERS = 4;
const NUM_FERRY_LAYERS = 2;
const NUM_TUNNEL_LAYERS = 1;
const NUM_TOLL_ROAD_LAYERS = 2;
const NUM_EV_STATION_LAYERS = 1;
const NUM_INSTRUCTION_LINE_LAYERS = 2;
const NUM_INSTRUCTION_ARROW_LAYERS = 1;
const NUM_SUMMARY_BUBBLE_LAYERS = 1;

describe("Routing tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Basic routes and waypoints show and clear flows", async () => {
        await mapEnv.loadMap({ bounds: amsterdamToRotterdamRoutes.bbox, fitBoundsOptions: { padding: 150 } });
        await initRouting();

        // Showing waypoints but not yet routes:
        await showWaypoints([
            [4.53074, 51.95102],
            [4.88951, 52.37229]
        ]);
        await waitForMapIdle();
        await waitForRenderedWaypoints(2);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(0);

        // Showing routes, keeping waypoints:
        await showRoutes(amsterdamToRotterdamRoutes);
        await waitForMapIdle();
        await waitForRenderedWaypoints(2);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);
        expect((await queryRenderedFeatures([ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).length).toBeGreaterThan(1);

        // clearing routes, but keeping waypoints:
        await clearRoutes();
        await waitForMapIdle();
        await waitForRenderedWaypoints(2);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);

        // clearing waypoints
        await clearWaypoints();
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Multiple show and clear flows", async () => {
        await mapEnv.loadMap(
            { bounds: amsterdamToRotterdamRoutes.bbox, fitBoundsOptions: { padding: 150 } },
            { style: { type: "published", include: ["trafficIncidents", "trafficFlow"] } }
        );
        await initRouting();

        await showWaypoints([
            [4.53074, 51.95102],
            [4.88951, 52.37229]
        ]);
        await showRoutes(amsterdamToRotterdamRoutes);
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);

        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(NUM_ROUTE_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_VEHICLE_RESTRICTED_SOURCE_ID)).toBe(
            NUM_VEHICLE_RESTRICTED_LAYERS
        );
        expect(await getNumVisibleLayersBySource(ROUTE_INCIDENTS_SOURCE_ID)).toBe(NUM_INCIDENT_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_FERRIES_SOURCE_ID)).toBe(NUM_FERRY_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_TOLL_ROADS_SOURCE_ID)).toBe(NUM_TOLL_ROAD_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_TUNNELS_SOURCE_ID)).toBe(NUM_TUNNEL_LAYERS);
        // no guidance in the route
        expect(await getNumVisibleLayersBySource(ROUTE_INSTRUCTIONS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(
            NUM_SUMMARY_BUBBLE_LAYERS
        );

        await waitForRenderedWaypoints(2);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 5000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_FERRIES_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 1, 2000);
        expect((await queryRenderedFeatures([ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).length).toBeGreaterThan(1);
        expect(await getSelectedSummaryBubbleProps()).toEqual({
            routeStyle: "selected",
            formattedDistance: "77 km",
            formattedDuration: "1 hr 04 min",
            formattedTraffic: "3 min"
        });

        // Changing the style, asserting that the route stays the same:
        await setStyle("standardDark");
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitForRenderedWaypoints(2);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_FERRIES_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 1, 2000);

        // Adding hillshade to style, asserting that the route stays the same:
        await initHillshade({ ensureAddedToStyle: true });
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitForRenderedWaypoints(2);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);

        await selectRoute(2);
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 0, 2000);
        await waitUntilRenderedFeatures([ROUTE_FERRIES_LINE_LAYER_ID], 0, 2000);
        await waitUntilRenderedFeatures([ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 2, 2000);

        // Changing the style (this time passing manually the parts again), asserting that the route stays the same:
        await setStyle({
            type: "published",
            id: "monoLight",
            include: ["trafficIncidents", "trafficFlow", "hillshade"]
        });
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);

        await clearRoutes();
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_VEHICLE_RESTRICTED_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_INCIDENTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_FERRIES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_TOLL_ROADS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_TUNNELS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_INSTRUCTIONS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(0);

        await clearWaypoints();
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_INCIDENTS_SOURCE_ID)).toBe(0);

        // Changing the style, asserting that the route stays the same:
        await setStyle("monoDark");
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(0);

        await showWaypoints([[4.53074, 51.95102]]);
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        await waitForRenderedWaypoints(1);

        // Changing the style, asserting that the route stays the same:
        await setStyle("standardLight");
        await waitForMapIdle();
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitForRenderedWaypoints(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Showing a route right after changing the style", async () => {
        await mapEnv.loadMap({ bounds: amsterdamToRotterdamRoutes.bbox, fitBoundsOptions: { padding: 150 } });
        await initRouting();
        await setStyle("monoLight");
        await showRoutes(amsterdamToRotterdamRoutes);

        await waitForMapIdle();
        await waitForTimeout(10000);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 5000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Showing waypoints right after changing the style", async () => {
        await mapEnv.loadMap({ bounds: amsterdamToRotterdamRoutes.bbox, fitBoundsOptions: { padding: 150 } });
        await initRouting();
        await setStyle("monoLight");
        await showWaypoints([
            [4.53074, 51.95102],
            [4.88951, 52.37229]
        ]);

        await waitForMapIdle();
        await waitForTimeout(2000);
        await waitForRenderedWaypoints(2);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 0, 5000);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Showing waypoints first and right after changing the style", async () => {
        await mapEnv.loadMap({ bounds: amsterdamToRotterdamRoutes.bbox, fitBoundsOptions: { padding: 150 } });
        await initRouting();
        await showWaypoints([
            [4.53074, 51.95102],
            [4.88951, 52.37229]
        ]);
        await setStyle("monoLight");

        await waitForMapIdle();
        await waitForRenderedWaypoints(2);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 0, 5000);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Show and clear flows using LDEVR route with guidance", async () => {
        await mapEnv.loadMap(
            { bounds: ldevrTestRoutes.bbox, fitBoundsOptions: { padding: 150 } },
            { style: { type: "published", id: "drivingLight", include: ["trafficIncidents"] } }
        );
        // We start zoomed far, asserting that some features won't be rendered:
        await page.evaluate(() => (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.zoomTo(5));

        await initRouting();

        await showWaypoints([
            [13.492, 52.507],
            [8.624, 50.104]
        ]);
        await showRoutes(ldevrTestRoutes);
        await waitForMapIdle();

        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(NUM_ROUTE_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_INCIDENTS_SOURCE_ID)).toBe(NUM_INCIDENT_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_TUNNELS_SOURCE_ID)).toBe(NUM_TUNNEL_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_EV_CHARGING_STATIONS_SOURCE_ID)).toBe(NUM_EV_STATION_LAYERS);
        // guidance should be filtered from far but layers still visible
        expect(await getNumVisibleLayersBySource(ROUTE_INSTRUCTIONS_SOURCE_ID)).toBe(NUM_INSTRUCTION_LINE_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID)).toBe(
            NUM_INSTRUCTION_ARROW_LAYERS
        );
        expect(await getNumVisibleLayersBySource(ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(
            NUM_SUMMARY_BUBBLE_LAYERS
        );

        // some sections don't have any data here, hence their layers stay invisible:
        expect(await getNumVisibleLayersBySource(ROUTE_FERRIES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_TOLL_ROADS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_VEHICLE_RESTRICTED_SOURCE_ID)).toBe(0);
        // charging stops might be filtered out from far but layers still visible
        expect(await getNumVisibleLayersBySource(ROUTE_EV_CHARGING_STATIONS_SOURCE_ID)).toBe(1);

        await waitForRenderedWaypoints(2);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 2, 5000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        // Instructions are filtered at this zoom level
        await waitUntilRenderedFeatures([ROUTE_INSTRUCTIONS_LINE_LAYER_ID, ROUTE_INSTRUCTIONS_ARROW_LAYER_ID], 0, 2000);
        // EV stops are filtered at this zoom level
        await waitUntilRenderedFeatures([ROUTE_EV_CHARGING_STATIONS_SYMBOL_LAYER_ID], 0, 2000);
        expect((await queryRenderedFeatures([ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).length).toBeGreaterThan(0);

        // we zoom a bit closer to see EV charging stops and some incidents:
        await page.evaluate(() => (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.zoomTo(6));
        await waitForMapIdle();

        // we should see some incident icons here:
        const renderedIncidents = await waitUntilRenderedFeaturesChange([ROUTE_INCIDENTS_SYMBOL_LAYER_ID], 0, 2000);
        expect(renderedIncidents).toHaveLength(2);

        const renderedEVStops = await waitUntilRenderedFeaturesChange(
            [ROUTE_EV_CHARGING_STATIONS_SYMBOL_LAYER_ID],
            0,
            2000
        );
        expect(renderedEVStops.length).toBeGreaterThan(2);

        // we now zoom in very close around the route start to spot some instructions:
        await page.evaluate(() =>
            (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.jumpTo({ center: [13.492, 52.507], zoom: 16 })
        );
        await waitForMapIdle();

        // we only should see the origin waypoint here:
        await waitForRenderedWaypoints(1);

        // we should see some instructions on the map now:
        const renderedInstructions = await waitUntilRenderedFeaturesChange(
            [ROUTE_INSTRUCTIONS_LINE_LAYER_ID, ROUTE_INSTRUCTIONS_ARROW_LAYER_ID],
            0,
            2000
        );
        expect(renderedInstructions.length).toBeGreaterThan(1);
    });

    test("Waypoints rendering", async () => {
        const waypoints: WaypointLike[] = [
            [4.8606, 52.39316],
            {
                type: "Feature",
                geometry: { type: "Point", coordinates: [4.8706, 52.40316] },
                properties: { address: { freeformAddress: "This is a test address, 9999 Some Country" } }
            },
            {
                type: "Feature",
                geometry: { type: "Point", coordinates: [4.8806, 52.41316] },
                properties: { radiusMeters: 30 }
            },
            {
                type: "Feature",
                geometry: { type: "Point", coordinates: [4.8906, 52.42316] },
                properties: { poi: { name: "This is a test POI." } }
            }
        ];

        await mapEnv.loadMap(
            { fitBoundsOptions: { padding: 150 }, center: [4.8806, 52.40316], zoom: 12 },
            { style: { type: "published", include: ["trafficIncidents"] } }
        );
        await initRouting();

        await showWaypoints(waypoints);
        await waitForMapIdle();
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        const renderedWaypoints = await waitForRenderedWaypoints(4);

        // rendered features array seem to come in reversed order from MapLibre:
        expect(renderedWaypoints[0].properties).toEqual({
            poi: '{"name":"This is a test POI."}',
            index: 3,
            indexType: "finish",
            title: "This is a test POI.",
            iconID: "waypointFinish"
        });
        expect(renderedWaypoints[1].properties).toEqual({
            index: 2,
            indexType: "middle",
            iconID: "waypointSoft",
            radiusMeters: 30
        });
        expect(renderedWaypoints[2].properties).toEqual({
            address: '{"freeformAddress":"This is a test address, 9999 Some Country"}',
            index: 1,
            indexType: "middle",
            title: "This is a test address, 9999 Some Country",
            iconID: "waypointStop",
            stopDisplayIndex: 1
        });
        expect(renderedWaypoints[3].properties).toEqual({
            index: 0,
            indexType: "start",
            iconID: "waypointStart"
        });
    });

    test("Updating advanced layers configuration", async () => {
        await mapEnv.loadMap(
            { fitBoundsOptions: { padding: 150 }, bounds: amsterdamToRotterdamRoutes.bbox },
            { style: { type: "published", include: ["trafficIncidents", "trafficFlow"] } }
        );
        await initRouting();

        await showWaypoints([
            [4.53074, 51.95102],
            [4.88951, 52.37229]
        ]);
        await showRoutes(amsterdamToRotterdamRoutes);
        await waitForMapIdle();
        expect(await getPaintProperty(ROUTE_LINE_LAYER_ID, "line-color")).toBe("#3f9cd9");

        const updatedLayers = defaultRouteLayersConfig.mainLines?.layers.map(({ id, layerSpec, ...rest }) => {
            if (id === ROUTE_LINE_LAYER_ID) {
                return {
                    id,
                    layerSpec: { ...layerSpec, paint: { ...layerSpec.paint, "line-color": "#ff0000" } },
                    ...rest
                };
            }
            return { id, layerSpec, ...rest };
        });

        const newConfig = { routeLayers: { mainLines: { layers: updatedLayers } } };
        await applyConfig(newConfig);
        await waitForMapIdle();
        expect(await getPaintProperty(ROUTE_LINE_LAYER_ID, "line-color")).toBe("#ff0000");

        // Changing the style with extra poi included style part, asserting that the config stays the same:
        await setStyle("monoLight");
        await waitForMapIdle();
        expect(await getPaintProperty(ROUTE_LINE_LAYER_ID, "line-color")).toBe("#ff0000");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Distance units configuration", async () => {
        await mapEnv.loadMap({ fitBoundsOptions: { padding: 150 }, bounds: amsterdamToRotterdamRoutes.bbox });
        await initRouting({ distanceUnits: "imperial_us" });
        await showRoutes(amsterdamToRotterdamRoutes);
        await waitForMapIdle();
        expect(await getSelectedSummaryBubbleProps()).toMatchObject({ formattedDistance: "48 mi" });

        await applyConfig({ distanceUnits: "metric" });
        await showRoutes(amsterdamToRotterdamRoutes);
        await waitForMapIdle();
        expect(await getSelectedSummaryBubbleProps()).toMatchObject({ formattedDistance: "77 km" });

        await applyConfig({ distanceUnits: "imperial_uk" });
        await showRoutes(amsterdamToRotterdamRoutes);
        await waitForMapIdle();
        expect(await getSelectedSummaryBubbleProps()).toMatchObject({ formattedDistance: "48 mi" });

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
