import { expect, type Page, test } from '@playwright/test';
import { nextMapIdleEvent } from '@testing/core-utils';
import type { Routes, WaypointLike } from 'core';
import {
    DisplayRouteSummaryProps,
    defaultRoutingLayers,
    HILLSHADE_SOURCE_ID,
    mapStyleLayerIDs,
    RoutingModuleConfig,
    TRAFFIC_FLOW_SOURCE_ID,
    TRAFFIC_INCIDENTS_SOURCE_ID,
} from 'map';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { spainToFranceAlternatives } from './data/RoutingModuleCountryCrossings.test.data';
import ldevrTestRoutesJson from './data/RoutingModuleLDEVR.test.data.json';
import rotterdamToAmsterdamRoutesJson from './data/RoutingModuleRotterdamToAmsterdamNoInstructions.test.data.json';
import {
    accidentOnlyRoutes,
    jamAndAccidentRoutes,
    jamOnlyRoutes,
} from './data/RoutingModuleTrafficIncidents.test.data';
import { MapsSDKThis } from './types/MapsSDKThis';
import { MapTestEnv } from './util/MapTestEnv';
import {
    getLayerIndex,
    getNumVisibleLayersBySource,
    getPaintProperty,
    initRouting,
    initRouting2,
    initTerrain,
    isLayerVisible,
    moveAndZoomTo,
    putGlobalConfig,
    queryRenderedFeatures,
    setStyle,
    showRoutes2,
    showWaypoints,
    waitForMapIdle,
    waitUntilRenderedFeatures,
    waitUntilRenderedFeaturesChange,
    zoomTo,
} from './util/TestUtils';

test.describe('Routing and waypoint display tests', () => {
    const ID_PREFIX = 'routes-0';

    // Layer IDs (including instance index prefix)
    const ROUTE_LINE_LAYER_ID = `${ID_PREFIX}-routeLine`;
    const ROUTE_DESELECTED_LINE_LAYER_ID = `${ID_PREFIX}-routeDeselectedLine`;
    const ROUTE_WAYPOINTS_SYMBOLS_LAYER_ID = `${ID_PREFIX}-routeWaypointSymbol`;
    const ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID = `${ID_PREFIX}-routeVehicleRestrictedForegroundLine`;
    const ROUTE_FERRIES_LINE_LAYER_ID = `${ID_PREFIX}-routeFerryLine`;
    const ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID = `${ID_PREFIX}-routeTollRoadOutline`;
    const ROUTE_INCIDENTS_JAM_SYMBOL_LAYER_ID = `${ID_PREFIX}-routeIncidentJamSymbol`;
    const ROUTE_INCIDENTS_CAUSE_SYMBOL_LAYER_ID = `${ID_PREFIX}-routeIncidentCauseSymbol`;
    const ROUTE_CHARGING_STOPS_SYMBOL_LAYER_ID = `${ID_PREFIX}-routeChargingStopSymbol`;
    const ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID = `${ID_PREFIX}-routeSummaryBubbleSymbol`;
    const ROUTE_INSTRUCTIONS_LINE_LAYER_ID = `${ID_PREFIX}-routeInstructionLine`;
    const ROUTE_INSTRUCTIONS_ARROW_LAYER_ID = `${ID_PREFIX}-routeInstructionArrowSymbol`;

    // Source IDs (including instance index prefix)
    const ROUTE_CHARGING_STOPS_SOURCE_ID = `${ID_PREFIX}-chargingStops`;
    const ROUTE_FERRIES_SOURCE_ID = `${ID_PREFIX}-ferries`;
    const ROUTE_INCIDENTS_SOURCE_ID = `${ID_PREFIX}-incidents`;
    const ROUTE_INSTRUCTIONS_ARROWS_SOURCE_ID = `${ID_PREFIX}-instructionArrows`;
    const ROUTE_INSTRUCTION_LINES_SOURCE_ID = `${ID_PREFIX}-instructionLines`;
    const ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID = `${ID_PREFIX}-summaryBubbles`;
    const ROUTE_TOLL_ROADS_SOURCE_ID = `${ID_PREFIX}-tollRoads`;
    const ROUTE_TUNNELS_SOURCE_ID = `${ID_PREFIX}-tunnels`;
    const ROUTE_VEHICLE_RESTRICTED_SOURCE_ID = `${ID_PREFIX}-vehicleRestricted`;
    const ROUTE_MAIN_LINES_SOURCE_ID = `${ID_PREFIX}-mainLines`;
    const WAYPOINTS_SOURCE_ID = `${ID_PREFIX}-waypoints`;

    const applyConfig = async (page: Page, config: RoutingModuleConfig) =>
        // @ts-ignore
        page.evaluate((inputConfig) => (globalThis as MapsSDKThis).routing?.applyConfig(inputConfig), config);

    const showRoutes = async (page: Page, routes: Routes) =>
        page.evaluate((inputRoutes: Routes) => (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes), routes);

    const selectRoute = async (page: Page, index: number) =>
        page.evaluate((inputIndex: number) => (globalThis as MapsSDKThis).routing?.selectRoute(inputIndex), index);

    const clearRoutes = async (page: Page) => page.evaluate(() => (globalThis as MapsSDKThis).routing?.clearRoutes());

    const clearWaypoints = async (page: Page) =>
        page.evaluate(() => (globalThis as MapsSDKThis).routing?.clearWaypoints());

    const waitForRenderedWaypoints = async (page: Page, numWaypoints: number) =>
        waitUntilRenderedFeatures(page, [ROUTE_WAYPOINTS_SYMBOLS_LAYER_ID], numWaypoints, 10000);

    const getSelectedSummaryBubbleProps = async (page: Page): Promise<DisplayRouteSummaryProps | undefined> => {
        const renderedBubbles: MapGeoJSONFeature[] = await queryRenderedFeatures(page, [
            ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID,
        ]);
        return renderedBubbles.find((f) => f.properties?.routeState === 'selected')
            ?.properties as DisplayRouteSummaryProps;
    };

    // (We reparse the route because it contains Date objects):
    const rotterdamToAmsterdamRoutes: Routes = JSON.parse(JSON.stringify(rotterdamToAmsterdamRoutesJson));
    const ldevrTestRoutes: Routes = JSON.parse(JSON.stringify(ldevrTestRoutesJson));

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
    // Traffic incident category rendering (jam-only, accident-only, jam+accident) is covered in the
    // 'Traffic incident category rendering' describe block below, using mocked route data.

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
        const shownAfterWaypoints = await page.evaluate(() => (globalThis as MapsSDKThis).routing?.getShown());
        expect(shownAfterWaypoints?.waypoints.features).toHaveLength(2);
        expect(shownAfterWaypoints?.mainLines.features).toHaveLength(0);

        // Showing routes, keeping waypoints:
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);
        await waitForRenderedWaypoints(page, 2);
        expect((await queryRenderedFeatures(page, [ROUTE_LINE_LAYER_ID])).length).toBeGreaterThanOrEqual(1);
        expect((await queryRenderedFeatures(page, [ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).length).toBeGreaterThan(1);
        const shownAfterRoutes = await page.evaluate(() => (globalThis as MapsSDKThis).routing?.getShown());
        expect(shownAfterRoutes?.mainLines.features.length).toBeGreaterThan(0);
        expect(shownAfterRoutes?.waypoints.features).toHaveLength(2);

        // clearing routes, but keeping waypoints:
        await clearRoutes(page);
        await waitForMapIdle(page);
        await waitForRenderedWaypoints(page, 2);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);
        const shownAfterClearRoutes = await page.evaluate(() => (globalThis as MapsSDKThis).routing?.getShown());
        expect(shownAfterClearRoutes?.mainLines.features).toHaveLength(0);
        expect(shownAfterClearRoutes?.waypoints.features).toHaveLength(2);

        // clearing waypoints
        await clearWaypoints(page);
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);
        const shownAfterClearWaypoints = await page.evaluate(() => (globalThis as MapsSDKThis).routing?.getShown());
        expect(shownAfterClearWaypoints?.waypoints.features).toHaveLength(0);
        expect(shownAfterClearWaypoints?.mainLines.features).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Multiple show and clear flows', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);

        await showWaypoints(page, [
            [4.53074, 51.95102],
            [4.88951, 52.37229],
        ]);
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

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
        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_FERRIES_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 1, 2000);

        // Adding hillshade to style, asserting that the route stays the same:
        await initTerrain(page, { hillshade: true });
        await waitForMapIdle(page);
        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 2000);

        await selectRoute(page, 2);
        await waitForMapIdle(page);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 1, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_DESELECTED_LINE_LAYER_ID], 2, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_VEHICLE_RESTRICTED_FOREGROUND_LAYER_ID], 0, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_FERRIES_LINE_LAYER_ID], 0, 2000);
        await waitUntilRenderedFeatures(page, [ROUTE_TOLL_ROADS_OUTLINE_LAYER_ID], 2, 2000);

        await clearRoutes(page);
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_INCIDENTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, TRAFFIC_FLOW_SOURCE_ID)).toBe(0);
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
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(0);
        expect(await getNumVisibleLayersBySource(page, ROUTE_INCIDENTS_SOURCE_ID)).toBe(0);

        await showWaypoints(page, [[4.53074, 51.95102]]);
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, WAYPOINTS_SOURCE_ID)).toBe(NUM_WAYPOINT_LAYERS);
        await waitForRenderedWaypoints(page, 1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Showing a route right after changing the style', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await waitForMapIdle(page);
        await setStyle(page, 'monoLight');
        await showRoutes(page, rotterdamToAmsterdamRoutes);

        await waitForMapIdle(page);
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
        await waitForMapIdle(page);
        await setStyle(page, 'monoLight');
        await showWaypoints(page, [
            [4.53074, 51.95102],
            [4.88951, 52.37229],
        ]);

        await waitForMapIdle(page);
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
        await waitForRenderedWaypoints(page, 2);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_ID], 0, 5000);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // TODO(LSI-263): Enable when flakyness has been fixed
    test('Show and clear flows using LDEVR route with guidance', { tag: '@flaky' }, async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: ldevrTestRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
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
                properties: {},
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
            poi: { name: 'This is a test POI.' },
            index: 3,
            indexType: 'finish',
            title: 'This is a test POI.',
            iconID: 'waypointFinish-0',
        });
        expect(renderedWaypoints[1].properties).toEqual({
            id: expect.any(String),
            index: 2,
            indexType: 'middle',
            iconID: 'waypointStop-0',
            stopDisplayIndex: 2,
        });
        expect(renderedWaypoints[2].properties).toEqual({
            id: expect.any(String),
            // maplibre-gl v6 returns nested GeoJSON feature properties as objects.
            address: { freeformAddress: 'This is a test address, 9999 Some Country' },
            index: 1,
            indexType: 'middle',
            title: 'This is a test address, 9999 Some Country',
            iconID: 'waypointStop-0',
            stopDisplayIndex: 1,
        });
        expect(renderedWaypoints[3].properties).toEqual({
            id: expect.any(String),
            index: 0,
            indexType: 'start',
            iconID: 'waypointStart-0',
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
        // Use `nextMapIdleEvent` instead of `waitForMapIdle` because the latter attempts to check whether the map is
        // currently idle, but that check can return true even though the mutations performed here are still in
        // progress.
        await nextMapIdleEvent(page);
        expect(await getSelectedSummaryBubbleProps(page)).toMatchObject({
            formattedDistance: '48 mi',
            formattedDuration: '1 hours 04 GLOBAL_MINUTES',
            formattedTraffic: '3 GLOBAL_MINUTES',
        });

        // We apply distance-only config, which means time config sticks back to global:
        await applyConfig(page, { displayUnits: { distance: { type: 'metric', kilometers: 'kilometers' } } });
        await nextMapIdleEvent(page);
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
        await nextMapIdleEvent(page);
        expect(await getSelectedSummaryBubbleProps(page)).toMatchObject({
            formattedDistance: '48 miles',
            formattedDuration: '1 HR 04 MIN',
            formattedTraffic: '3 MIN',
        });

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Summary bubbles are not displayed when visible is set to false', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            fitBoundsOptions: { padding: 150 },
            bounds: rotterdamToAmsterdamRoutes.bbox,
        });
        await initRouting(page, { summaryBubbles: { visible: false } });
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        expect(await getNumVisibleLayersBySource(page, ROUTE_SUMMARY_BUBBLES_POINT_SOURCE_ID)).toBe(0);
        expect(await queryRenderedFeatures(page, [ROUTE_SUMMARY_BUBBLES_POINT_LAYER_ID])).toHaveLength(0);
        // Routes themselves are still shown:
        expect(await getNumVisibleLayersBySource(page, ROUTE_MAIN_LINES_SOURCE_ID)).toBe(NUM_ROUTE_LAYERS);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

test.describe('Traffic incident category rendering', () => {
    const ID_PREFIX = 'routes-0';
    const ROUTE_INCIDENTS_JAM_SYMBOL_LAYER_ID = `${ID_PREFIX}-routeIncidentJamSymbol`;
    const ROUTE_INCIDENTS_CAUSE_SYMBOL_LAYER_ID = `${ID_PREFIX}-routeIncidentCauseSymbol`;
    const ROUTE_INCIDENTS_SOURCE_ID = `${ID_PREFIX}-incidents`;
    const NUM_INCIDENT_LAYERS = 4;

    const showRoutes = async (page: Page, routes: Routes) =>
        page.evaluate((inputRoutes: Routes) => (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes), routes);

    test('Jam-only section renders jam symbol but not cause symbol', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: jamOnlyRoutes.bbox,
            fitBoundsOptions: { padding: 50 },
        });
        await initRouting(page);
        await showRoutes(page, jamOnlyRoutes);
        await waitForMapIdle(page);

        expect(await getNumVisibleLayersBySource(page, ROUTE_INCIDENTS_SOURCE_ID)).toBe(NUM_INCIDENT_LAYERS);

        const jamFeatures = await waitUntilRenderedFeatures(page, [ROUTE_INCIDENTS_JAM_SYMBOL_LAYER_ID], 1, 5000);
        expect(jamFeatures[0].properties?.jamIconID).toMatch(/^traffic-jam-minor-/);

        expect(await queryRenderedFeatures(page, [ROUTE_INCIDENTS_CAUSE_SYMBOL_LAYER_ID])).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Accident-only section renders cause symbol but not jam symbol', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: accidentOnlyRoutes.bbox,
            fitBoundsOptions: { padding: 50 },
        });
        await initRouting(page);
        await showRoutes(page, accidentOnlyRoutes);
        await waitForMapIdle(page);

        expect(await getNumVisibleLayersBySource(page, ROUTE_INCIDENTS_SOURCE_ID)).toBe(NUM_INCIDENT_LAYERS);

        const causeFeatures = await waitUntilRenderedFeatures(page, [ROUTE_INCIDENTS_CAUSE_SYMBOL_LAYER_ID], 1, 5000);
        expect(causeFeatures[0].properties?.causeIconID).toBe('traffic-incidents-accident');

        expect(await queryRenderedFeatures(page, [ROUTE_INCIDENTS_JAM_SYMBOL_LAYER_ID])).toHaveLength(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Section with jam and accident renders both jam and cause symbols', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: jamAndAccidentRoutes.bbox,
            fitBoundsOptions: { padding: 50 },
        });
        await initRouting(page);
        await showRoutes(page, jamAndAccidentRoutes);
        await waitForMapIdle(page);

        expect(await getNumVisibleLayersBySource(page, ROUTE_INCIDENTS_SOURCE_ID)).toBe(NUM_INCIDENT_LAYERS);

        const jamFeatures = await waitUntilRenderedFeatures(page, [ROUTE_INCIDENTS_JAM_SYMBOL_LAYER_ID], 1, 5000);
        expect(jamFeatures[0].properties?.jamIconID).toMatch(/^traffic-jam-moderate-/);

        const causeFeatures = await waitUntilRenderedFeatures(page, [ROUTE_INCIDENTS_CAUSE_SYMBOL_LAYER_ID], 1, 5000);
        expect(causeFeatures[0].properties?.causeIconID).toBe('traffic-incidents-accident');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

test.describe('Route section display configuration', () => {
    const ID_PREFIX = 'routes-0';

    // (We reparse the routes because they contain Date objects):
    const rotterdamToAmsterdamRoutes: Routes = JSON.parse(JSON.stringify(rotterdamToAmsterdamRoutesJson));
    const ldevrTestRoutes: Routes = JSON.parse(JSON.stringify(ldevrTestRoutesJson));

    const sourceID = (key: string) => `${ID_PREFIX}-${key}`;
    const layerID = (name: string) => `${ID_PREFIX}-${name}`;

    // The generated types that band the route, with the source each owns and a fixture that
    // actually carries sections of that type — a type the route has none of would be hidden for
    // having no features, which would pass the visibility assertions without testing them.
    // `speedLimit` is absent because it posts a sign instead of a line; its own tests are below.
    const GENERATED_SECTIONS = [
        { type: 'motorway', lineLayer: 'routeSectionMotorwayLine', routes: rotterdamToAmsterdamRoutes },
        { type: 'urban', lineLayer: 'routeSectionUrbanLine', routes: rotterdamToAmsterdamRoutes },
        { type: 'importantRoadStretch', lineLayer: 'routeSectionImportantRoadStretchLine', routes: ldevrTestRoutes },
        { type: 'lowEmissionZone', lineLayer: 'routeSectionLowEmissionZoneLine', routes: ldevrTestRoutes },
    ] as const;

    // The generated types the module draws before anything is configured: sparse along a route and
    // consequential to drive, plus `speedLimit`, which draws a sign rather than a band and so never
    // stripes the route. Only `lowEmissionZone` is in the fixtures above, and it is the reason a
    // type being "off" is asserted per type rather than for every generated type at once.
    const GENERATED_DRAWN_BY_DEFAULT = new Set<string>(['carTrain', 'lowEmissionZone', 'speedLimit', 'tollVignette']);

    const optInSections = GENERATED_SECTIONS.filter((section) => !GENERATED_DRAWN_BY_DEFAULT.has(section.type));

    // The types that draw themselves, with the source and one line layer each.
    const BESPOKE_SECTIONS = [
        { type: 'ferry', sourceKey: 'ferries', lineLayer: 'routeFerryLine', numLayers: 2 },
        { type: 'tollRoad', sourceKey: 'tollRoads', lineLayer: 'routeTollRoadOutline', numLayers: 2 },
        { type: 'traffic', sourceKey: 'incidents', lineLayer: 'routeIncidentBackgroundLine', numLayers: 4 },
        { type: 'tunnel', sourceKey: 'tunnels', lineLayer: 'routeTunnelLine', numLayers: 1 },
        {
            type: 'vehicleRestricted',
            sourceKey: 'vehicleRestricted',
            lineLayer: 'routeVehicleRestrictedForegroundLine',
            numLayers: 2,
        },
    ] as const;

    // Two icon ids the base-map sprite carries. The first is what the toll sections draw by
    // default; both are asserted to be in the sprite where they are used, so a sprite that drops
    // one fails loudly instead of quietly drawing nothing.
    const SPRITE_ICON_ID = 'poi-toll_plaza';
    const OTHER_SPRITE_ICON_ID = 'poi-border_control';

    const spriteHasImage = async (page: Page, imageID: string): Promise<boolean> =>
        page.evaluate(
            (inputImageID) => (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.hasImage(inputImageID),
            imageID,
        );

    const layoutProperty = async (page: Page, layer: string, property: string): Promise<unknown> =>
        page.evaluate(
            ({ inputLayer, inputProperty }) =>
                (globalThis as MapsSDKThis).tomtomMap.mapLibreMap.getLayoutProperty(inputLayer, inputProperty),
            { inputLayer: layer, inputProperty: property },
        );

    const applyConfig = async (page: Page, config: RoutingModuleConfig) =>
        // @ts-ignore
        page.evaluate((inputConfig) => (globalThis as MapsSDKThis).routing?.applyConfig(inputConfig), config);

    const showRoutes = async (page: Page, routes: Routes) =>
        page.evaluate((inputRoutes: Routes) => (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes), routes);

    const selectRoute = async (page: Page, index: number) =>
        page.evaluate((inputIndex: number) => (globalThis as MapsSDKThis).routing?.selectRoute(inputIndex), index);

    // How many features each of the given `getShown()` keys holds, in one round trip.
    const numShownFeatures = async (page: Page, keys: readonly string[]): Promise<Record<string, number>> =>
        page.evaluate((inputKeys) => {
            const shown = (globalThis as MapsSDKThis).routing?.getShown() as
                | Record<string, { features: unknown[] } | undefined>
                | undefined;
            return Object.fromEntries(inputKeys.map((key) => [key, shown?.[key]?.features.length ?? 0]));
        }, keys);

    test('A type covering most of the route stays off until asked for, while the sparse types keep drawing', async ({
        page,
    }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        // The sections are in the source — they just are not drawn. Holding features is what makes
        // this worth asserting: every other source here is visible whenever it has any.
        const typesInThisRoute = optInSections
            .filter((section) => section.routes === rotterdamToAmsterdamRoutes)
            .map((section) => section.type);
        const shownCounts = await numShownFeatures(
            page,
            typesInThisRoute.map((type) => `${type}Sections`),
        );
        for (const type of typesInThisRoute) {
            const key = `${type}Sections`;
            expect(shownCounts[key], `${type} should have sections in this route`).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource(page, sourceID(key)), `${type} should not be drawn`).toBe(0);
        }

        for (const { type, sourceKey, numLayers } of BESPOKE_SECTIONS) {
            expect(await getNumVisibleLayersBySource(page, sourceID(sourceKey)), `${type} should be drawn`).toBe(
                numLayers,
            );
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    for (const { type, lineLayer, routes } of GENERATED_SECTIONS) {
        test(`Asking for the ${type} sections draws them, and leaves the opt-in rest alone`, async ({ page }) => {
            const mapEnv = await MapTestEnv.loadPageAndMap(page, {
                bounds: routes.bbox,
                fitBoundsOptions: { padding: 150 },
            });
            await initRouting(page, { sections: { [type]: { visible: true } } });
            await showRoutes(page, routes);
            await waitForMapIdle(page);

            expect(await getNumVisibleLayersBySource(page, sourceID(`${type}Sections`))).toBe(1);
            // A route carries however many sections of a type it carries, so wait for the count to
            // leave zero rather than for a number this fixture happens to have.
            await waitUntilRenderedFeaturesChange(page, [layerID(lineLayer)], 0, 10000);

            // The other opt-in types are still off: asking for one asks for none of the rest.
            for (const other of optInSections.filter((section) => section.type !== type)) {
                expect(
                    await getNumVisibleLayersBySource(page, sourceID(`${other.type}Sections`)),
                    `${other.type} should still be off`,
                ).toBe(0);
            }

            expect(mapEnv.consoleErrors).toHaveLength(0);
        });
    }

    test('A halo bands the route from underneath; an inline section takes the route line over', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page, { sections: { motorway: { visible: true } } });
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        const motorwayLayer = layerID('routeSectionMotorwayLine');
        const haloWidth = await getPaintProperty(page, motorwayLayer, 'line-width');
        const routeOutlineWidth = await getPaintProperty(page, layerID('routeOutline'), 'line-width');
        // A halo has to clear the route's own outline, which is opaque: at that width or narrower,
        // a section drawn under the route renders no visible pixels at all.
        expect(haloWidth).not.toEqual(routeOutlineWidth);
        expect(await getLayerIndex(page, motorwayLayer)).toBeLessThan(await getLayerIndex(page, layerID('routeLine')));

        await applyConfig(page, { sections: { motorway: { visible: true, style: 'inline' } } });
        await waitForMapIdle(page);

        // Inline is the other half of the same knob: the route's own width, drawn over the route
        // line so the stretch appears in the section's colour.
        const inlineWidth = await getPaintProperty(page, motorwayLayer, 'line-width');
        expect(inlineWidth).not.toEqual(haloWidth);
        expect(inlineWidth).toEqual(await getPaintProperty(page, layerID('routeLine'), 'line-width'));
        expect(await getLayerIndex(page, motorwayLayer)).toBeGreaterThan(
            await getLayerIndex(page, layerID('routeLine')),
        );

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('A type drawn over the route line can be sent under it as a halo', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        // `tunnel` draws inline by default: the route itself goes grey through a tunnel.
        const tunnelLayer = layerID('routeTunnelLine');
        const routeLine = layerID('routeLine');
        expect(await getLayerIndex(page, tunnelLayer)).toBeGreaterThan(await getLayerIndex(page, routeLine));

        await applyConfig(page, { sections: { tunnel: { style: 'halo' } } });
        await waitForMapIdle(page);
        expect(await getLayerIndex(page, tunnelLayer)).toBeLessThan(await getLayerIndex(page, routeLine));

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Colour, opacity and pattern reach a generated section and a bespoke one alike', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page, {
            sections: {
                urban: { visible: true, color: '#123456', opacity: 0.9, pattern: 'dashed' },
                tunnel: { color: '#402060', opacity: 0.75 },
            },
        });
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        const urbanLayer = layerID('routeSectionUrbanLine');
        expect(await getPaintProperty(page, urbanLayer, 'line-color')).toBe('#123456');
        expect(await getPaintProperty(page, urbanLayer, 'line-opacity')).toBe(0.9);
        expect(await getPaintProperty(page, urbanLayer, 'line-dasharray')).toEqual([2, 1.5]);

        const tunnelLayer = layerID('routeTunnelLine');
        expect(await getPaintProperty(page, tunnelLayer, 'line-color')).toBe('#402060');
        expect(await getPaintProperty(page, tunnelLayer, 'line-opacity')).toBe(0.75);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('A type that draws itself can be switched off and back on at runtime', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, sourceID('tunnels'))).toBe(1);

        await applyConfig(page, { sections: { tunnel: { visible: false } } });
        await waitForMapIdle(page);
        // Still shown as data, just not drawn — the knob is display, not a filter on the route.
        expect((await numShownFeatures(page, ['tunnels'])).tunnels).toBeGreaterThan(0);
        expect(await getNumVisibleLayersBySource(page, sourceID('tunnels'))).toBe(0);
        expect(await queryRenderedFeatures(page, [layerID('routeTunnelLine')])).toHaveLength(0);

        await applyConfig(page, { sections: { tunnel: { visible: true } } });
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, sourceID('tunnels'))).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('An icon asked for at runtime reaches the map without showing the routes again', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page, { sections: { urban: { visible: true } } });
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        const urbanSource = sourceID('urbanSections');
        const symbolLayer = layerID('routeSectionUrbanSymbol');
        expect(await getNumVisibleLayersBySource(page, urbanSource)).toBe(1);
        expect(await spriteHasImage(page, SPRITE_ICON_ID)).toBe(true);

        // The icon layer does not exist yet: it is added by this config change, and has to reach
        // the map on its own rather than waiting for the next `showRoutes`.
        await applyConfig(page, {
            sections: { urban: { visible: true, icon: { image: SPRITE_ICON_ID, placement: 'along' } } },
        });
        await waitForMapIdle(page);

        expect(await getNumVisibleLayersBySource(page, urbanSource)).toBe(2);
        expect(await isLayerVisible(page, symbolLayer)).toBe(true);
        await waitUntilRenderedFeaturesChange(page, [symbolLayer], 0, 10000);

        // And taking it away again removes the layer rather than leaving it behind.
        await applyConfig(page, { sections: { urban: { visible: true } } });
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, urbanSource)).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('The icon on a type that already draws one is replaced', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page, { sections: { tollRoad: { icon: { image: OTHER_SPRITE_ICON_ID } } } });
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        const tollSymbolLayer = layerID('routeTollRoadSymbol');
        expect(await spriteHasImage(page, OTHER_SPRITE_ICON_ID)).toBe(true);
        expect(await getNumVisibleLayersBySource(page, sourceID('tollRoads'))).toBe(2);
        expect(await layoutProperty(page, tollSymbolLayer, 'icon-image')).toBe(OTHER_SPRITE_ICON_ID);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Section display survives a style change and a route selection change', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page, {
            sections: { motorway: { visible: true, color: '#AABBCC' }, traffic: { visible: false } },
        });
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        const motorwaySource = sourceID('motorwaySections');
        const motorwayLayer = layerID('routeSectionMotorwayLine');
        expect(await getNumVisibleLayersBySource(page, motorwaySource)).toBe(1);
        expect(await getNumVisibleLayersBySource(page, sourceID('incidents'))).toBe(0);

        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        await waitUntilRenderedFeatures(page, [layerID('routeLine')], 1, 5000);
        expect(await getNumVisibleLayersBySource(page, motorwaySource)).toBe(1);
        expect(await getPaintProperty(page, motorwayLayer, 'line-color')).toBe('#AABBCC');
        // The opted-out type does not come back with the new style either.
        expect(await getNumVisibleLayersBySource(page, sourceID('incidents'))).toBe(0);

        await selectRoute(page, 1);
        await waitForMapIdle(page);
        expect(await getNumVisibleLayersBySource(page, motorwaySource)).toBe(1);
        expect(await getNumVisibleLayersBySource(page, sourceID('incidents'))).toBe(0);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('A raw layer spec still overrides the knobs', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page, {
            sections: { motorway: { visible: true, color: '#AABBCC' } },
            layers: { sections: { motorway: { routeSectionMotorwayLine: { paint: { 'line-color': '#FF0000' } } } } },
        });
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        const motorwayLayer = layerID('routeSectionMotorwayLine');
        expect(await getPaintProperty(page, motorwayLayer, 'line-color')).toBe('#FF0000');
        // Deep-merged, so the opacity the knob tier put there survives the paint override.
        expect(await getPaintProperty(page, motorwayLayer, 'line-opacity')).toBeDefined();
        expect(await getNumVisibleLayersBySource(page, sourceID('motorwaySections'))).toBe(1);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    /**
     * The coordinate a speed limit change stands on, which is where `atChange` posts its sign.
     *
     * @remarks
     * The route's own midpoint frames no sign, since a stretch here runs up to 50 km. Consecutive
     * sections never share a limit, so any section's start is a change.
     */
    const aSpeedLimitChange = (nth: number): [number, number] => {
        const route = ldevrTestRoutes.features[0];
        const section = (route.properties.sections.speedLimit ?? [])[nth];
        if (!section) throw new Error('The fixture carries no speed limit sections to frame.');

        return route.geometry.coordinates[section.startPointIndex] as [number, number];
    };

    test('Speed limits post a sign per section without being asked, and no line at all', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: ldevrTestRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await showRoutes(page, ldevrTestRoutes);
        // Signs start at zoom 10, where one is about one stretch of road, and the whole of this
        // route fits well below that — so the map moves onto a limit change and in.
        await moveAndZoomTo(page, { center: aSpeedLimitChange(1), zoom: 12 });
        await waitForMapIdle(page);

        const signLayer = layerID('routeSectionSpeedLimitSign');
        await waitUntilRenderedFeaturesChange(page, [signLayer], 0, 10000);
        expect(await isLayerVisible(page, signLayer)).toBe(true);
        // The sign is the type's whole presentation, so the source carries it and nothing else.
        expect(await getNumVisibleLayersBySource(page, sourceID('speedLimitSections'))).toBe(1);

        // The number comes off the section itself, and the face with it.
        const signFeature = (await queryRenderedFeatures(page, [signLayer]))[0];
        expect(Number(signFeature.properties.signLabel)).toBe(signFeature.properties.maxSpeedLimitInKmh);
        expect(signFeature.properties.signImageID).toContain('routeSpeedLimitWhiteDisc');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('The signs switch off through the type own visible knob, like every other section', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: ldevrTestRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page, { sections: { speedLimit: { visible: false } } });
        await showRoutes(page, ldevrTestRoutes);
        await waitForMapIdle(page);

        expect(await isLayerVisible(page, layerID('routeSectionSpeedLimitSign'))).toBe(false);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    /** The number a mph sign posts for a km/h limit: converted, then rounded to the step signs come in. */
    const mphPostedFor = (maxSpeedLimitInKmh: number) => Math.round((maxSpeedLimitInKmh * 1000) / 1609.344 / 5) * 5;

    test('A sign re-reads its number when the unit it is posted in changes', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: ldevrTestRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await showRoutes(page, ldevrTestRoutes);
        await moveAndZoomTo(page, { center: aSpeedLimitChange(1), zoom: 12 });
        await waitForMapIdle(page);

        const signLayer = layerID('routeSectionSpeedLimitSign');
        await waitUntilRenderedFeaturesChange(page, [signLayer], 0, 10000);
        for (const sign of await queryRenderedFeatures(page, [signLayer])) {
            expect(Number(sign.properties.signLabel)).toBe(sign.properties.maxSpeedLimitInKmh);
        }

        // The number rides on the feature rather than on the paint, so re-deriving it is the only
        // thing that can change what a sign reads — restacking and restyling leave it as it was.
        await applyConfig(page, { sections: { speedLimit: { sign: { unit: 'mph' } } } });
        await waitForMapIdle(page);

        const postedInMph = await queryRenderedFeatures(page, [signLayer]);
        expect(postedInMph.length).toBeGreaterThan(0);
        for (const sign of postedInMph) {
            expect(Number(sign.properties.signLabel)).toBe(mphPostedFor(sign.properties.maxSpeedLimitInKmh));
        }

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('What a sign gives way to follows its placement, until the knob says otherwise', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: ldevrTestRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });
        await initRouting(page);
        await showRoutes(page, ldevrTestRoutes);
        // The pins are what a sign gives way to, so they have to be on the map for the ordering to
        // mean anything. Where they sit does not matter to it.
        const routeLine = ldevrTestRoutes.features[0].geometry.coordinates;
        await showWaypoints(page, [routeLine[0], routeLine.at(-1) ?? routeLine[0]]);
        await waitForMapIdle(page);

        // MapLibre places symbols from the topmost layer down, so giving way means sitting under the
        // layer whose symbols win. Every index is read fresh: moving the sign layer shifts the rest.
        const signLayer = layerID('routeSectionSpeedLimitSign');
        const waypointLayer = layerID('routeWaypointSymbol');
        const labelIndex = () => getLayerIndex(page, mapStyleLayerIDs.lowestLabel);

        // `atChange`, the default: each sign is the only one posting its change, so it yields to
        // the route's icons and outranks the map's labels.
        expect(await getLayerIndex(page, signLayer)).toBeGreaterThan(await labelIndex());
        expect(await getLayerIndex(page, signLayer)).toBeLessThan(await getLayerIndex(page, waypointLayer));

        // `along` repeats each sign, so one lost to a place name is posted again further along —
        // hence yielding to the labels by default there.
        await applyConfig(page, { sections: { speedLimit: { sign: { placement: 'along' } } } });
        await waitForMapIdle(page);
        expect(await getLayerIndex(page, signLayer)).toBeLessThan(await labelIndex());

        // And the knob outranks the placement's default either way.
        await applyConfig(page, {
            sections: { speedLimit: { sign: { placement: 'along', priority: 'aboveRouteIcons' } } },
        });
        await waitForMapIdle(page);
        expect(await getLayerIndex(page, signLayer)).toBeGreaterThan(await getLayerIndex(page, waypointLayer));

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Border crossing colours follow the map theme, and an override outranks it', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: spainToFranceAlternatives.bbox });
        await initRouting(page);
        await showRoutes(page, spainToFranceAlternatives);
        await waitForMapIdle(page);

        // The light style puts the near-black plaque under a near-white label.
        const crossingLayer = layerID('routeCountryCrossing');
        expect(await getPaintProperty(page, crossingLayer, 'text-color')).toBe('#F1F3F5');

        await setStyle(page, 'standardDark');
        await waitForMapIdle(page);
        // The dark style swaps both, so the plaque still reads as a label rather than as canvas.
        expect(await getPaintProperty(page, crossingLayer, 'text-color')).toBe('#1A2024');

        // A configured plaque takes the label that reads on it, without the caller naming one.
        await applyConfig(page, { countryCrossings: { color: '#0B5FA5' } });
        await waitForMapIdle(page);
        expect(await getPaintProperty(page, crossingLayer, 'text-color')).toBe('#F1F3F5');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Border crossings turn to the route only when the alignment knob asks them to', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: spainToFranceAlternatives.bbox });
        await initRouting(page);
        await showRoutes(page, spainToFranceAlternatives);
        await waitForMapIdle(page);

        const crossingLayer = layerID('routeCountryCrossing');
        expect(await layoutProperty(page, crossingLayer, 'text-rotation-alignment')).toBe('viewport');
        expect(await layoutProperty(page, crossingLayer, 'text-rotate')).toBeUndefined();

        await applyConfig(page, { countryCrossings: { alignment: 'route' } });
        await waitForMapIdle(page);

        // Map-aligned, and turned by the bearing the feature carries rather than by a constant.
        expect(await layoutProperty(page, crossingLayer, 'text-rotation-alignment')).toBe('map');
        expect(JSON.stringify(await layoutProperty(page, crossingLayer, 'text-rotate'))).toContain('bearing');

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('A border crossing draws under the waypoint pins', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: spainToFranceAlternatives.bbox });
        await initRouting(page);
        await showRoutes(page, spainToFranceAlternatives);
        // A plaque draws whatever is in its place, so the pins have to be on the map for the
        // ordering to mean anything. Where they sit along the route does not matter to it.
        const routeLine = spainToFranceAlternatives.features[0].geometry.coordinates;
        await showWaypoints(page, [routeLine[0], routeLine.at(-1) ?? routeLine[0]]);
        await waitForMapIdle(page);

        expect(await getLayerIndex(page, layerID('routeCountryCrossing'))).toBeLessThan(
            await getLayerIndex(page, layerID('routeWaypointSymbol')),
        );

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test('Picking an alternative moves the border crossings onto it, as it does the rest of the route', async ({
        page,
    }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, { bounds: spainToFranceAlternatives.bbox });
        await initRouting(page);
        await showRoutes(page, spainToFranceAlternatives);
        await waitForMapIdle(page);

        // The crossings filter on the selected route, so they have to be restyled with everything
        // else — a stale `routeState` leaves the plaques on the route the picker no longer names.
        const crossingStates = async (): Promise<string[]> =>
            page.evaluate(
                () =>
                    (globalThis as MapsSDKThis).routing
                        ?.getShown()
                        .countryCrossings.features.map((feature) => feature.properties.routeState) ?? [],
            );

        expect(await crossingStates()).toEqual(['selected', 'deselected']);

        await selectRoute(page, 1);
        await waitForMapIdle(page);
        expect(await crossingStates()).toEqual(['deselected', 'selected']);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

test.describe('Multiple routing module instances', () => {
    // (We reparse the route because it contains Date objects):
    const rotterdamToAmsterdamRoutes = JSON.parse(JSON.stringify(rotterdamToAmsterdamRoutesJson));
    const ldevrTestRoutes = JSON.parse(JSON.stringify(ldevrTestRoutesJson));

    const NUM_ROUTE_LAYERS = 5;

    const showRoutes = async (page: Page, routes: Routes) =>
        page.evaluate((inputRoutes: Routes) => (globalThis as MapsSDKThis).routing?.showRoutes(inputRoutes), routes);

    test('Multiple routing module instances with different main colors', async ({ page }) => {
        const mapEnv = await MapTestEnv.loadPageAndMap(page, {
            bounds: rotterdamToAmsterdamRoutes.bbox,
            fitBoundsOptions: { padding: 150 },
        });

        // Initialize two routing modules with different main colors
        await initRouting(page, { theme: { mainColor: 'white' } });
        await initRouting2(page, { theme: { mainColor: '#FF0000' } });

        // Show Rotterdam to Amsterdam routes on first instance
        await showRoutes(page, rotterdamToAmsterdamRoutes);
        await waitForMapIdle(page);

        // Show LDEVR routes on second instance
        await showRoutes2(page, ldevrTestRoutes);
        await waitForMapIdle(page);

        // Assert that both route line layers are visible
        const ID_PREFIX_1 = 'routes-0';
        const ID_PREFIX_2 = 'routes-1';
        const ROUTE_LINE_LAYER_1 = `${ID_PREFIX_1}-routeLine`;
        const ROUTE_LINE_LAYER_2 = `${ID_PREFIX_2}-routeLine`;

        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_1], 1, 5000);
        await waitUntilRenderedFeatures(page, [ROUTE_LINE_LAYER_2], 1, 5000);

        // Verify different colors are applied
        expect(await getPaintProperty(page, ROUTE_LINE_LAYER_1, 'line-color')).toBe('white');
        expect(await getPaintProperty(page, ROUTE_LINE_LAYER_2, 'line-color')).toBe('#FF0000');

        // Assert that both routes have visible layers
        expect(await getNumVisibleLayersBySource(page, `${ID_PREFIX_1}-mainLines`)).toBe(NUM_ROUTE_LAYERS);
        expect(await getNumVisibleLayersBySource(page, `${ID_PREFIX_2}-mainLines`)).toBe(NUM_ROUTE_LAYERS);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
