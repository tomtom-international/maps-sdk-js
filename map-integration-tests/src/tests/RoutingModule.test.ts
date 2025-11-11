import { expect, type Page, test } from '@playwright/test';
import type { Routes, WaypointLike } from 'core';
import {
    DisplayRouteSummaryProps,
    defaultRoutingLayers,
    HILLSHADE_SOURCE_ID,
    RoutingModuleConfig,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID,
} from 'map';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import ldevrTestRoutesJson from './data/RoutingModuleLDEVR.test.data.json';
import rotterdamToAmsterdamRoutesJson from './data/RoutingModuleRotterdamToAmsterdamNoInstructions.test.data.json';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getNumVisibleLayersBySource,
    getPaintProperty,
    initHillshade,
    initRouting,
    moveAndZoomTo,
    putGlobalConfig,
    queryRenderedFeatures,
    setStyle,
    showWaypoints,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures,
    waitUntilRenderedFeaturesChange,
    zoomTo,
} from './util/TestUtils';

const ROUTE_LINE_LAYER_ID = 'routeLine';
const ROUTE_DESELECTED_LINE_LAYER_ID = 'routeDeselectedLine';
const ROUTE_WAYPOINTS_SYMBOLS_LAYER_ID = 'routeWaypointSymbol';
const ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID = 'routeVehicleRestrictedForegroundLine';
const ROUTE_FERRIES_LINE_LAYER_ID = 'routeFerryLine';
const ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID = 'routeTollRoadOutline';
const ROUTE_INCIDENTS_JAM_SYMBOL_LAYER_ID = 'routeIncidentJamSymbol';
const ROUTE_INCIDENTS_CAUSE_SYMBOL_LAYER_ID = 'routeIncidentCauseSymbol';
const ROUTE_CHARGING_STOPS_SYMBOL_LAYER_ID = 'routeChargingStopSymbol';
const ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID = 'routeSummaryBubbleSymbol';
const ROUTE_INSTRUCTIONS_LINE_LAYER_ID = 'routeInstructionLine';
const ROUTE_INSTRUCTIONS_ARROW_LAYER_ID = 'routeInstructionArrowSymbol';

// Locally define source ID constants (matching RoutingModule.ts values)
const ROUTE_CHARGING_STOPS_SOURCE_ID = 'routeChargingStops';
const ROUTE_FERRIES_SOURCE_ID = 'routeFerries';
const ROUTE_INCIDENTS_SOURCE_ID = 'routeIncidents';
const ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID = 'routeInstructionArrows';
const ROUTE_INSTRUCTION_LINES_SOURCE_ID = 'routeInstructionLines';
const ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID = 'routeSummaryBubbles';
const ROUTE_TOLL_ROADS_SOURCE_ID = 'routeTollRoads';
const ROUTE_TUNNELS_SOURCE_ID = 'routeTunnels';
const ROUTE_VEHICLE_RESTRICTED_SOURCE_ID = 'routeVehicleRestricted';
const ROUTE_MAIN_LINES_SOURCE_ID = 'routeMainLines';
const WAYPOINTS_SOURCE_ID = 'routeWaypoints';

const applyConfig = async (page: Page, config: RoutingModuleConfig) =>
    // @ts-ignore
    page.evaluate((inputConfig) => (globalThis as MapsSDKThis).routing?.applyConfig(inputConfig), config);

const showRoutes = async (page: Page, routes: Routes) =>
    page.evaluate((inputRoutes: Routes) => (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes), routes);

const selectRoute = async (page: Page, index: number) =>
    page.evaluate((inputIndex: number) => (globalThis as MapsSDKThis).routing?.selectRoute(inputIndex), index);

const clearRoutes = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).routing?.clearRoutes());

const clearWaypoints = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).routing?.clearWaypoints());

const waitForRenderedWaypoints = async (page: Page, numWaypoints: number) =>
    waitUntilRenderedFeatures(page, [ROUTE_WAYPOINTS_SYMBOLS_LAYER_ID], numWaypoints, 5000);

const getSelectedSummaryBubbleProps = async (page: Page): Promise<DisplayRouteSummaryProps | undefined> => {
    const renderedBubbles: MapGeoJSONFeature[] = await queryRenderedFeatures(page, [
        ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID,
    ]);
    return renderedBubbles.find((f) => f.properties?.routeState === 'selected')?.properties as DisplayRouteSummaryProps;
};

// (We reparse the route because it contains Date objects):
const rotterdamToAmsterdamRoutes = JSON.parse(JSON.stringify(rotterdamToAmsterdamRoutesJson));
const ldevrTestRoutes = JSON.parse(JSON.stringify(ldevrTestRoutesJson));

const NUM_WAYPOINT_LAYERS = 2;
const NUM_ROUTE_LAYERS = 5;
const NUM_VEHICLE_RESTRICTED_LAYERS = 2;
const NUM_INCIDENT_LAYERS = 4;
const NUM_FERRY_LAYERS = 2;
const NUM_TUNNEL_LAYERS = 1;
const NUM_TOLL_ROAD_LAYERS = 2;
const NUM_EV_STATION_LAYERS = 1;
const NUM_INSTRUCTION_LINE_LAYERS = 2;
const NUM_INSTRUCTION_ARROW_LAYERS = 1;
const NUM_SUMMARY_BUBBLE_LAYERS = 1;

test.describe('Routing and waypoint display tests', () => {
    // TODO: assert traffic incident visuals where more than one incident cause is to be shown (jam + accident, etc.)

    test('Basic routes and waypoints show and clear flows', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);

        // Showing waypoints but not yet routes:
        await showWaypoints(page, [
            [4.53074, 51.95102],
            [4.88951, 52.37229],
        ]);
        await waitForMapIdle(page);
        await waitForRenderedWaypoints(page, 2);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(0);

        // Showing routes, keeping waypoints:
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);
        await waitForRenderedWaypoints(page, 2);
        expect((await queryRenderedFeatures(page, [ROUTE_LINE_LAYER_ID])).length).toBeGreaterThanOrEqual(1);
        expect((await queryRenderedFeatures(page, [ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).length).toBeGreaterThan(1);

        // clearing routes, but keeping waypoints:
        await clearRoutes(page);
        await waitForMapIdle(page);
        await waitForRenderedWaypoints(page, 2);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);

        // clearing waypoints
        await clearWaypoints(page);
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Multiple show and clear flows', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(
            page,
            { bounds: rotterdamToAmsterdamRoutes.bbox, fitBoundsOptions: { padding: 150 } },
            { style: { type: 'standard', include: ['trafficIncidents', 'trafficFlow'] } },
        );
        await initRouting(page);

        await showWaypoints(page, [
            [4.53074, 51.95102],
            [4.88951, 52.37229],
        ]);
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);

        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(NUM_ROUTE_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_VEHICLE_RESTRICTED_SOURCE_ID)).toBe(
            NUM_VEHICLE_RESTRICTED_LAYERS,
        );
        expect(await getNumVisibleLayersBySource(page, ROUTE_INCIDENTS_SOURCE_ID)).toBe(NUM_INCIDENT_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_FERRIES_SOURCE_ID)).toBe(NUM_FERRY_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_TOLL_ROADS_SOURCE_ID)).toBe(NUM_TOLL_ROAD_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_TUNNELS_SOURCE_ID)).toBe(NUM_TUNNEL_LAYERS);
        // no guidance in the route
        expect(await getNumVisibleLayersBySource(page, ROUTE_INSTRUCTION_LINES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(
            NUM_SUMMARY_BUBBLE_LAYERS,
        );

        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 5000);
        await waitUntilRenderedFeatures(page, [ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_FERRIES_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 1, 2000);
        expect((await queryRenderedFeatures(page, [ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).length).toBeGreaterThan(1);
        expect(await getSelectedSummaryBubbleProps(page)).toMatchObject({
            routeState: 'selected',
            formattedDistance: '77 km',
            formattedDuration: '1 hr 04 min',
            formattedTraffic: '3 min',
            magnitudeOfDelay: 'minor',
        });

        // Changing the style, asserting that the route stays the same:
        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_FERRIES_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 1, 2000);

        // Adding hillshade to style, asserting that the route stays the same:
        await initHillshade(page, { ensureAddedToStyle: true });
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 2000);

        await selectRoute(page, 2);
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 0, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_FERRIES_LINE_LAYER_ID], 0, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 2, 2000);

        // Changing the style (this time passing manually the parts again), asserting that the route stays the same:
        await setStyle(page, {
            type: 'standard',
            id: 'monoLight',
            include: ['trafficIncidents', 'trafficFlow', 'hillshade'],
        });
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);

        await clearRoutes(page);
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_VEHICLE_RESTRICTED_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_INCIDENTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_FERRIES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_TOLL_ROADS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_TUNNELS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_INSTRUCTION_LINES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(0);

        await clearWaypoints(page);
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_INCIDENTS_SOURCE_ID)).toBe(0);

        // Changing the style, asserting that the route stays the same:
        await setStyle(page, 'monoDark');
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(0);

        await showWaypoints(page, [[4.53074, 51.95102]]);
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        await waitForRenderedWaypoints(page, 1);

        // Changing the style, asserting that the route stays the same:
        await setStyle(page, 'standardLight');
        await waitForMapIdle(page);
        expect(mapEnv.consoleErrors).toHaveLength(0);
        await waitForRenderedWaypoints(page, 1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Showing a route right after changing the style', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await setStyle(page, 'monoLight');
        await showRoutes(page, rotterdamToAmsterdamRoutes);

        await waitForMapIdle(page);
        await waitForTimeout(2000);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 5000);
        await waitUntilRenderedFeatures(page, [ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Showing waypoints right after changing the style', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await setStyle(page, 'monoLight');
        await showWaypoints(page, [
            [4.53074, 51.95102],
            [4.88951, 52.37229],
        ]);

        await waitForMapIdle(page);
        await waitForTimeout(2000);
        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 0, 5000);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Showing waypoints first and right after changing the style', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await showWaypoints(page, [
            [4.53074, 51.95102],
            [4.88951, 52.37229],
        ]);
        await setStyle(page, 'monoLight');

        await waitForMapIdle(page);
        await waitForTimeout(2000);
        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 0, 5000);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Show and clear flows using LDEVR route with guidance', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(
            page,
            { bounds: ldevrTestRoutes.bbox, fitBoundsOptions: { padding: 150 } },
            { style: { type: 'standard', id: 'drivingLight', include: ['trafficIncidents'] } },
        );
        // We start zoomed far, asserting that some features won't be rendered:
        await zoomTo(page, 3);

        await initRouting(page);

        await showWaypoints(page, [
            [4.89066, 52.37317], // Amsterdam
            [2.3522, 48.8566], // Paris
        ]);
        await showRoutes(page, ldevrTestRoutes);
        await waitForMapIdle(page);

        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(NUM_ROUTE_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_INCIDENTS_SOURCE_ID)).toBe(NUM_INCIDENT_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_TUNNELS_SOURCE_ID)).toBe(NUM_TUNNEL_LAYERS);
        expect(await getNumVisibleLayersBySource(page, ROUTE_CHARGING_STOPS_SOURCE_ID)).toBe(NUM_EV_STATION_LAYERS);
        // guidance should be filtered from far but layers still visible
        expect(await getNumVisibleLayersBySource(page, ROUTE_INSTRUCTION_LINES_SOURCE_ID)).toBe(
            NUM_INSTRUCTION_LINE_LAYERS,
        );
        expect(await getNumVisibleLayersBySource(page, ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID)).toBe(
            NUM_INSTRUCTION_ARROW_LAYERS,
        );
        expect(await getNumVisibleLayersBySource(page, ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(
            NUM_SUMMARY_BUBBLE_LAYERS,
        );

        // some sections don't have any data here, hence their layers stay invisible:
        expect(await getNumVisibleLayersBySource(page, ROUTE_FERRIES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_TOLL_ROADS_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_VEHICLE_RESTRICTED_SOURCE_ID)).toBeGreaterThan(0);
        // charging stops might be filtered out from far but layers still visible
        expect(await getNumVisibleLayersBySource(page, ROUTE_CHARGING_STOPS_SOURCE_ID)).toBe(1);

        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 5000);
        // no alternatives expected:
        await waitUntilRenderedFeatures(page, [ROUTE_DESELECTED_LINE_LAYER_ID], 0, 2000);
        // Instructions are filtered at this zoom level
        await waitUntilRenderedFeatures(
            page,
            [ROUTE_INSTRUCTIONS_LINE_LAYER_ID, ROUTE_INSTRUCTIONS_ARROW_LAYER_ID],
            0,
            2000,
        );
        // EV stops are filtered at this zoom level
        await waitUntilRenderedFeatures(page, [ROUTE_CHARGING_STOPS_SYMBOL_LAYER_ID], 0, 2000);
        // Summary bubbles has been moved to the top and it should show up here:
        expect(await queryRenderedFeatures(page, [ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).toHaveLength(1);

        // we zoom a bit closer to see EV charging stops and some incidents:
        await zoomTo(page, 8);
        await waitForMapIdle(page);

        // we should see some incident icons here:
        const renderedIncidents = await waitUntilRenderedFeaturesChange(
            page,
            [ROUTE_INCIDENTS_JAM_SYMBOL_LAYER_ID, ROUTE_INCIDENTS_CAUSE_SYMBOL_LAYER_ID],
            0,
            2000,
        );
        expect(renderedIncidents.length).toBeGreaterThan(0);

        const renderedEvStops = await waitUntilRenderedFeaturesChange(
            page,
            [ROUTE_CHARGING_STOPS_SYMBOL_LAYER_ID],
            0,
            2000,
        );
        expect(renderedEvStops).toHaveLength(2);

        // Summary bubbles should now appear:
        expect((await queryRenderedFeatures(page, [ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).length).toBeGreaterThan(0);

        // we now zoom in very close around the route start to spot some instructions:
        await moveAndZoomTo(page, { center: [4.89069, 52.37317], zoom: 18 });
        await waitForMapIdle(page);

        // we only should see the origin waypoint here:
        await waitForRenderedWaypoints(page, 1);

        // we should see some instructions on the map now:
        const renderedInstructions = await waitUntilRenderedFeaturesChange(
            page,
            [ROUTE_INSTRUCTIONS_LINE_LAYER_ID, ROUTE_INSTRUCTIONS_ARROW_LAYER_ID],
            0,
            2000,
        );
        expect(renderedInstructions.length).toBeGreaterThan(0);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Waypoints rendering', async ({ page }) => {
        const waypoints: WaypointLike[] = [
            [4.8606, 52.39316],
            {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [4.8706, 52.40316] },
                properties: { address: { freeformAddress: 'This is a test address, 9999 Some Country' } },
            },
            {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [4.8806, 52.41316] },
                properties: { radiusMeters: 30 },
            },
            {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [4.8906, 52.42316] },
                properties: { poi: { name: 'This is a test POI.' } },
            },
        ];

        const mapEnv = await MapTestEnv.loadPageAndMap(
            page,
            { fitBoundsOptions: { padding: 150 }, center: [4.8806, 52.40316], zoom: 12 },
            { style: { type: 'standard', include: ['trafficIncidents'] } },
        );
        await initRouting(page);

        await showWaypoints(page, waypoints);
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        const renderedWaypoints = await waitForRenderedWaypoints(page, 4);

        // rendered features array seem to come in reversed order from MapLibre:
        expect(renderedWaypoints[0].properties).toEqual({
            id: expect.any(String),
            poi: '{"name":"This is a test POI."}',
            index: 3,
            indexType: 'finish',
            title: 'This is a test POI.',
            iconID: 'waypointFinish',
        });
        expect(renderedWaypoints[1].properties).toEqual({
            id: expect.any(String),
            index: 2,
            indexType: 'middle',
            iconID: 'waypointSoft',
            radiusMeters: 30,
        });
        expect(renderedWaypoints[2].properties).toEqual({
            id: expect.any(String),
            address: '{"freeformAddress":"This is a test address, 9999 Some Country"}',
            index: 1,
            indexType: 'middle',
            title: 'This is a test address, 9999 Some Country',
            iconID: 'waypointStop',
            stopDisplayIndex: 1,
        });
        expect(renderedWaypoints[3].properties).toEqual({
            id: expect.any(String),
            index: 0,
            indexType: 'start',
            iconID: 'waypointStart',
        });
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Updating advanced layers configuration', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(
            page,
            { fitBoundsOptions: { padding: 150 }, bounds: rotterdamToAmsterdamRoutes.bbox },
            { style: { type: 'standard', include: ['trafficIncidents', 'trafficFlow'] } },
        );
        await initRouting(page);

        await showWaypoints(page, [
            [4.53074, 51.95102],
            [4.88951, 52.37229],
        ]);
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);
        expect(await getPaintProperty(page, ROUTE_LINE_LAYER_ID, 'line-color')).toBe('#36A8F0');

        await applyConfig(page, {
            theme: { mainColor: 'red' },
            layers: {
                mainLines: {
                    routeLine: {
                        ...defaultRoutingLayers.mainLines?.routeLine,
                        paint: { ...defaultRoutingLayers.mainLines?.routeLine?.paint, 'line-color': '#ff0000' },
                    },
                },
            },
        });
        await waitForMapIdle(page);
        expect(await getPaintProperty(page, ROUTE_LINE_LAYER_ID, 'line-color')).toBe('#ff0000');

        // Changing the style with extra poi included style part, asserting that the config stays the same:
        await setStyle(page, 'monoLight');
        await waitForMapIdle(page);
        await waitForTimeout(1000);
        expect(await getPaintProperty(page, ROUTE_LINE_LAYER_ID, 'line-color')).toBe('#ff0000');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Distance and time units configuration', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            fitBoundsOptions: { padding: 150 },
            bounds: rotterdamToAmsterdamRoutes.bbox,
        });
        await putGlobalConfig(page, { displayUnits: { time: { hours: 'GLOBAL_HOURS', minutes: 'GLOBAL_MINUTES' } } });

        // routing hours override global config:
        await initRouting(page, { displayUnits: { distance: { type: 'imperial_us' }, time: { hours: 'hours' } } });
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);
        expect(await getSelectedSummaryBubbleProps(page)).toMatchObject({
            formattedDistance: '48 mi',
            formattedDuration: '1 hours 04 GLOBAL_MINUTES',
            formattedTraffic: '3 GLOBAL_MINUTES',
        });

        // We apply distance-only config, which means time config sticks back to global:
        await applyConfig(page, { displayUnits: { distance: { type: 'metric', kilometers: 'kilometers' } } });
        await waitForMapIdle(page);
        expect(await getSelectedSummaryBubbleProps(page)).toMatchObject({
            formattedDistance: '77 kilometers',
            formattedDuration: '1 GLOBAL_HOURS 04 GLOBAL_MINUTES',
            formattedTraffic: '3 GLOBAL_MINUTES',
        });

        // We apply both some distance and time configs:
        await applyConfig(page, {
            displayUnits: {
                distance: { type: 'imperial_uk', miles: 'miles', kilometers: 'IGNORED' },
                time: { hours: 'HR', minutes: 'MIN' },
            },
        });
        await waitForMapIdle(page);
        expect(await getSelectedSummaryBubbleProps(page)).toMatchObject({
            formattedDistance: '48 miles',
            formattedDuration: '1 HR 04 MIN',
            formattedTraffic: '3 MIN',
        });

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
