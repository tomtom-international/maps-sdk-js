import {
    DEFAULT_ROUTE_LAYERS_CONFIGURATION,
    ROUTE_DESELECTED_LINE_LAYER_ID,
    ROUTE_FERRIES_LINE_LAYER_ID,
    ROUTE_FERRIES_SOURCE_ID,
    ROUTE_INCIDENTS_SOURCE_ID,
    ROUTE_LINE_LAYER_ID,
    ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID,
    ROUTE_TOLL_ROADS_SOURCE_ID,
    ROUTE_TUNNELS_SOURCE_ID,
    ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID,
    ROUTE_VEHICLE_RESTRICTED_SOURCE_ID,
    ROUTES_SOURCE_ID,
    RoutingModuleConfig,
    WAYPOINT_SYMBOLS_LAYER_ID,
    WAYPOINTS_SOURCE_ID
} from "map";
import { Routes, WaypointLike } from "@anw/maps-sdk-js/core";
import { MapsSDKThis } from "./types/MapsSDKThis";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import rotterdamToAmsterdamRoutes from "./RotterdamToAmsterdamRoute.data.json";
import {
    getLayerById,
    getNumVisibleLayersBySource,
    initHillshade,
    setStyle,
    waitForMapIdle,
    waitForMapReady,
    waitForTimeout,
    waitUntilRenderedFeatures
} from "./util/TestUtils";

const initRouting = async () =>
    page.evaluate(async () => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.routing = await mapsSDKThis.MapsSDK.RoutingModule.init(mapsSDKThis.tomtomMap);
    });

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
    waitUntilRenderedFeatures([WAYPOINT_SYMBOLS_LAYER_ID], numWaypoint, 10000);

// (We reparse the route because it contains Date objects):
const parsedTestRoutes = JSON.parse(JSON.stringify(rotterdamToAmsterdamRoutes));

const NUM_WAYPOINT_LAYERS = 2;
const NUM_ROUTE_LAYERS = 4;
const NUM_VEHICLE_RESTRICTED_LAYERS = 2;
const NUM_INCIDENT_LAYERS = 4;
const NUM_FERRY_LAYERS = 2;
const NUM_TUNNEL_LAYERS = 1;
const NUM_TOLL_ROAD_LAYERS = 2;

describe("Routing tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Show and clear flows", async () => {
        await mapEnv.loadMap(
            { fitBoundsOptions: { padding: 150 }, bounds: parsedTestRoutes.bbox },
            { style: { type: "published", include: ["traffic_incidents", "traffic_flow"] } }
        );
        await initRouting();

        await showWaypoints([
            [4.53074, 51.95102],
            [4.88951, 52.37229]
        ]);
        await showRoutes(parsedTestRoutes);
        await waitForMapIdle();

        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(NUM_ROUTE_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_VEHICLE_RESTRICTED_SOURCE_ID)).toBe(
            NUM_VEHICLE_RESTRICTED_LAYERS
        );
        expect(await getNumVisibleLayersBySource(ROUTE_INCIDENTS_SOURCE_ID)).toBe(NUM_INCIDENT_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_FERRIES_SOURCE_ID)).toBe(NUM_FERRY_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_TOLL_ROADS_SOURCE_ID)).toBe(NUM_TOLL_ROAD_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTE_TUNNELS_SOURCE_ID)).toBe(NUM_TUNNEL_LAYERS);
        await waitUntilRenderedFeatures([WAYPOINT_SYMBOLS_LAYER_ID], 2, 10000);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 5000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_FERRIES_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 1, 2000);

        // Changing the style, asserting that the route stays the same:
        await setStyle("standardDark");
        await waitForMapIdle();
        await waitUntilRenderedFeatures([WAYPOINT_SYMBOLS_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_FERRIES_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 1, 2000);

        // Adding hillshade to style, asserting that the route stays the same:
        await initHillshade({ ensureAddedToStyle: true });
        await waitForMapIdle();
        await waitUntilRenderedFeatures([WAYPOINT_SYMBOLS_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);

        await selectRoute(2);
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures([ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 0, 2000);
        await waitUntilRenderedFeatures([ROUTE_FERRIES_LINE_LAYER_ID], 0, 2000);
        await waitUntilRenderedFeatures([ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 2, 2000);

        // Changing the style (this time passing manually the parts again), asserting that the route stays the same:
        await setStyle({
            type: "published",
            id: "monoLight",
            include: ["traffic_incidents", "traffic_flow", "hillshade"]
        });
        await waitForMapIdle();
        await waitUntilRenderedFeatures([ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures([ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);

        await clearRoutes();
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_VEHICLE_RESTRICTED_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_INCIDENTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_FERRIES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_TOLL_ROADS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_TUNNELS_SOURCE_ID)).toBe(0);

        await clearWaypoints();
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(ROUTE_INCIDENTS_SOURCE_ID)).toBe(0);

        // Changing the style, asserting that the route stays the same:
        await setStyle("drivingDark");
        await waitForMapIdle();
        expect(await getNumVisibleLayersBySource(ROUTES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(0);

        await showWaypoints([[4.53074, 51.95102]]);
        expect(await getNumVisibleLayersBySource(WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        await waitForRenderedWaypoints(1);

        // Changing the style, asserting that the route stays the same:
        await setStyle("standardLight");
        await waitForMapIdle();
        await waitForRenderedWaypoints(1);
        expect(mapEnv.consoleErrors).toHaveLength(0);
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
            { fitBoundsOptions: { padding: 100 }, center: [4.8806, 52.40316], zoom: 12 },
            { style: { type: "published", include: ["traffic_incidents"] } }
        );
        await initRouting();

        await showWaypoints(waypoints);
        await waitForMapReady();
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

    test("Updating configuration", async () => {
        await mapEnv.loadMap(
            { fitBoundsOptions: { padding: 150 }, bounds: parsedTestRoutes.bbox },
            { style: { type: "published", include: ["traffic_incidents", "traffic_flow"] } }
        );
        await initRouting();

        await showWaypoints([
            [4.53074, 51.95102],
            [4.88951, 52.37229]
        ]);
        await showRoutes(parsedTestRoutes);
        await waitForMapIdle();
        let mainLineLayer: any | undefined = await getLayerById(ROUTE_LINE_LAYER_ID);
        expect(mainLineLayer?.paint["line-color"]).toStrictEqual("#3f9cd9");

        const updatedLayers = DEFAULT_ROUTE_LAYERS_CONFIGURATION.mainLine?.layers.map(({ id, layerSpec, beforeID }) => {
            if (id === ROUTE_LINE_LAYER_ID) {
                return {
                    id,
                    beforeID,
                    layerSpec: { ...layerSpec, paint: { ...layerSpec.paint, "line-color": "#ff0000" } }
                };
            }
            return { id, beforeID, layerSpec };
        });

        const newConfig = { routeLayers: { mainLine: { layers: updatedLayers } } } as RoutingModuleConfig;
        await applyConfig(newConfig);
        await waitForMapIdle();
        mainLineLayer = await getLayerById(ROUTE_LINE_LAYER_ID);
        expect(mainLineLayer?.paint["line-color"]).toBe("#ff0000");

        // Changing the style with extra poi included style part, asserting that the config stays the same:
        await setStyle("monoLight");
        await waitForMapIdle();
        await waitForTimeout(2000);
        mainLineLayer = await getLayerById(ROUTE_LINE_LAYER_ID);
        expect(mainLineLayer?.paint["line-color"]).toBe("#ff0000");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
