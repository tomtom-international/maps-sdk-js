import { Routes, WaypointLike } from "@anw/go-sdk-js/core";
import { GOSDKThis } from "./types/GOSDKThis";
import {
    getNumVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapStyleToLoad,
    waitUntilRenderedFeatures
} from "./util/MapIntegrationTestEnv";
import testRoutes from "./TestRoute.json";

const initRouting = async () =>
    page.evaluate(() => {
        const goSDKThis = globalThis as GOSDKThis;
        goSDKThis.routing = new goSDKThis.GOSDK.RoutingModule(goSDKThis.goSDKMap);
    });

const showRoutes = async (routes: Routes) =>
    page.evaluate((inputRoutes: Routes) => {
        (globalThis as GOSDKThis).routing?.showRoutes(inputRoutes);
        // @ts-ignore
    }, routes);

const clearRoutes = async () => page.evaluate(() => (globalThis as GOSDKThis).routing?.clearRoutes());

const getNumVisibleRouteLayers = async () => getNumVisibleLayersBySource("routes");

const waitForRenderedRoutes = async (numRoutes: number) =>
    waitUntilRenderedFeatures("routeLineForeground", numRoutes, 10000);

const showWaypoints = async (waypoints: WaypointLike[]) =>
    page.evaluate((inputWaypoints) => {
        (globalThis as GOSDKThis).routing?.showWaypoints(inputWaypoints);
        // @ts-ignore
    }, waypoints);

const clearWaypoints = async () => page.evaluate(() => (globalThis as GOSDKThis).routing?.clearWaypoints());

const getNumVisibleWaypointLayers = async () => getNumVisibleLayersBySource("waypoints");

const waitForRenderedWaypoints = async (numWaypoint: number) =>
    waitUntilRenderedFeatures("waypointSymbols", numWaypoint, 10000);

// (We reparse the route because it contains Date objects):
const parsedTestRoutes = JSON.parse(JSON.stringify(testRoutes));

const NUM_ROUTE_LAYERS = 2;
const NUM_WAYPOINT_LAYERS = 2;

describe("Routing tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    test("Show and clear flows", async () => {
        await mapEnv.loadMap({ fitBoundsOptions: { padding: 100 } }, { bounds: parsedTestRoutes });
        await initRouting();

        await showRoutes(parsedTestRoutes);
        await showWaypoints([
            [4.8906, 52.37316],
            [4.47061, 51.92289]
        ]);
        await waitForMapStyleToLoad();
        expect(await getNumVisibleRouteLayers()).toStrictEqual(NUM_ROUTE_LAYERS);
        expect(await getNumVisibleWaypointLayers()).toStrictEqual(NUM_WAYPOINT_LAYERS);
        await waitForRenderedRoutes(1);
        await waitForRenderedWaypoints(2);

        await clearRoutes();
        expect(await getNumVisibleRouteLayers()).toStrictEqual(0);
        expect(await getNumVisibleWaypointLayers()).toStrictEqual(NUM_WAYPOINT_LAYERS);

        await clearWaypoints();
        expect(await getNumVisibleRouteLayers()).toStrictEqual(0);
        expect(await getNumVisibleWaypointLayers()).toStrictEqual(0);

        await showWaypoints([[4.8906, 52.37316]]);
        expect(await getNumVisibleWaypointLayers()).toStrictEqual(NUM_WAYPOINT_LAYERS);
        await waitForRenderedWaypoints(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Waypoints rendering", async () => {
        const waypoints: WaypointLike[] = [
            [4.8606, 52.39316],
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [4.8706, 52.40316]
                },
                properties: { address: { freeformAddress: "This is a test address, 9999 Some Country" } }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [4.8806, 52.41316]
                },
                properties: { radiusMeters: 30 }
            },
            {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [4.8906, 52.42316]
                },
                properties: { poi: { name: "This is a test POI." } }
            }
        ];

        await mapEnv.loadMap(
            { fitBoundsOptions: { padding: 100 }, center: [4.8806, 52.40316], zoom: 12 },
            { exclude: ["traffic_flow"] }
        );
        await initRouting();

        await showWaypoints(waypoints);
        await waitForMapStyleToLoad();
        expect(await getNumVisibleWaypointLayers()).toStrictEqual(NUM_WAYPOINT_LAYERS);
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
});
