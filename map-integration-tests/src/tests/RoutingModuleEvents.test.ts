import type { EventType } from "map";
import { WAYPOINT_SYMBOLS_LAYER_ID } from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import {
    getClickedTopFeature,
    getDisplayWaypoints,
    getHoveredTopFeature,
    getNumHoversAndLongHovers,
    getNumLeftAndRightClicks,
    getPixelCoords,
    initRouting,
    showWaypoints,
    waitForEventState,
    waitForMapIdle
} from "./util/TestUtils";
import rotterdamToAmsterdamRoutesJSON from "./data/RoutingModuleRotterdamToAmsterdamNoInstructions.test.data.json";
import type { MapsSDKThis } from "./types/MapsSDKThis";
import type { Waypoint } from "@anw/maps-sdk-js/core";

// (We reparse the route because it contains Date objects):
const rotterdamToAmsterdamRoutes = JSON.parse(JSON.stringify(rotterdamToAmsterdamRoutesJSON));

const setupWaypointsHoverHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.routing?.events.waypoints.on("hover", (waypoint) => {
            mapsSDKThis._numOfHovers++;
            mapsSDKThis._hoveredTopFeature = waypoint;
        });
        mapsSDKThis.routing?.events.waypoints.on("long-hover", (waypoint) => {
            mapsSDKThis._numOfLongHovers++;
            mapsSDKThis._hoveredTopFeature = waypoint;
        });
    });

const clearWaypointsHoverHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.routing?.events.waypoints.off("hover");
        mapsSDKThis.routing?.events.waypoints.off("long-hover");
    });

const setupWaypointsClickHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.routing?.events.waypoints.on("click", (waypoint) => {
            mapsSDKThis._numOfClicks++;
            mapsSDKThis._clickedTopFeature = waypoint;
        });
        mapsSDKThis.routing?.events.waypoints.on("contextmenu", (waypoint) => {
            mapsSDKThis._numOfContextmenuClicks++;
            mapsSDKThis._clickedTopFeature = waypoint;
        });
    });

const clearWaypointsClickHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.routing?.events.waypoints.off("click");
        mapsSDKThis.routing?.events.waypoints.off("contextmenu");
    });

const waitForWaypointsEventState = async (eventState: EventType | undefined, id?: string) =>
    waitForEventState(eventState, [WAYPOINT_SYMBOLS_LAYER_ID], id);

describe("Routing and waypoint events tests", () => {
    const mapEnv = new MapIntegrationTestEnv();
    beforeAll(async () => mapEnv.loadPage());
    beforeEach(async () => {
        await mapEnv.loadMap(
            { bounds: rotterdamToAmsterdamRoutes.bbox, fitBoundsOptions: { padding: 150 } },
            {
                // We use longer-than-default delays to help with unstable resource capacity in CI/CD:
                events: { longHoverDelayAfterMapMoveMS: 3500, longHoverDelayOnStillMapMS: 3000 }
            }
        );
        await initRouting();
        await waitForMapIdle();
    });

    afterEach(async () => {
        await clearWaypointsHoverHandlers();
        await clearWaypointsClickHandlers();
    });

    const waypoint0Coords = [4.53074, 51.95102];
    const waypoint1Coords = [4.63, 52.05];
    const waypoint2Coords = [4.88951, 52.37229];

    test("Hovering and clicking on a single waypoint without handlers", async () => {
        await showWaypoints([waypoint0Coords]);
        await waitForMapIdle();
        const waypoint0PixelCoords = await getPixelCoords(waypoint0Coords);

        // Hovering over waypoint before setting up handlers:
        await page.mouse.move(waypoint0PixelCoords.x, waypoint0PixelCoords.y);
        // No event should have been triggered yet:
        expect(await getHoveredTopFeature<Waypoint>()).toBeUndefined();
        await waitForWaypointsEventState(undefined);

        // Clicking over waypoint before setting up handlers:
        await page.mouse.click(waypoint0PixelCoords.x, waypoint0PixelCoords.y);
        // No event should have been triggered yet:
        expect(await getClickedTopFeature<Waypoint>()).toBeUndefined();
        await waitForWaypointsEventState(undefined);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Hovering on a single waypoint shown by coordinates", async () => {
        await setupWaypointsHoverHandlers();
        await showWaypoints([waypoint0Coords]);
        await waitForMapIdle();

        const waypoint0PixelCoords = await getPixelCoords(waypoint0Coords);
        await page.mouse.move(waypoint0PixelCoords.x, waypoint0PixelCoords.y);

        await waitForWaypointsEventState("hover");
        expect(await getNumHoversAndLongHovers()).toEqual([1, 0]);
        expect(await getHoveredTopFeature<Waypoint>()).toMatchObject({
            id: expect.any(String),
            type: "Feature",
            geometry: { type: "Point", coordinates: waypoint0Coords },
            properties: { id: expect.any(String), eventState: "hover" }
        });

        await waitForWaypointsEventState("long-hover");
        expect(await getNumHoversAndLongHovers()).toEqual([1, 1]);
        expect(await getHoveredTopFeature<Waypoint>()).toMatchObject({
            id: expect.any(String),
            type: "Feature",
            geometry: { type: "Point", coordinates: waypoint0Coords },
            properties: { id: expect.any(String), eventState: "long-hover" }
        });

        // Hovering away from the waypoint:
        await page.mouse.move(waypoint0PixelCoords.x - 100, waypoint0PixelCoords.y - 100);
        await waitForWaypointsEventState(undefined);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Clicking on a single waypoint shown by coordinates", async () => {
        await setupWaypointsClickHandlers();
        await showWaypoints([waypoint0Coords]);
        await waitForMapIdle();

        const waypoint0PixelCoords = await getPixelCoords(waypoint0Coords);
        await page.mouse.click(waypoint0PixelCoords.x, waypoint0PixelCoords.y);

        await waitForWaypointsEventState("click");
        expect(await getNumLeftAndRightClicks()).toEqual([1, 0]);
        expect(await getClickedTopFeature<Waypoint>()).toMatchObject({
            id: expect.any(String),
            type: "Feature",
            geometry: { type: "Point", coordinates: waypoint0Coords },
            properties: { id: expect.any(String), eventState: "click" }
        });

        await page.mouse.click(waypoint0PixelCoords.x, waypoint0PixelCoords.y, { button: "right" });
        await waitForWaypointsEventState("contextmenu");
        expect(await getNumLeftAndRightClicks()).toEqual([1, 1]);
        expect(await getClickedTopFeature<Waypoint>()).toMatchObject({
            id: expect.any(String),
            type: "Feature",
            geometry: { type: "Point", coordinates: waypoint0Coords },
            properties: { id: expect.any(String), eventState: "contextmenu" }
        });

        // Clicking away from the waypoint:
        await page.mouse.click(waypoint0PixelCoords.x - 100, waypoint0PixelCoords.y - 100);
        await waitForWaypointsEventState(undefined);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Hovering and clicking on single waypoint feature", async () => {
        await setupWaypointsHoverHandlers();
        await setupWaypointsClickHandlers();
        const id = "waypoint0";

        const waypointFeature: Waypoint = {
            id,
            type: "Feature",
            geometry: { type: "Point", coordinates: waypoint0Coords },
            properties: {}
        };

        await showWaypoints([waypointFeature]);
        await waitForMapIdle();

        const waypoint0PixelCoords = await getPixelCoords(waypoint0Coords);
        await page.mouse.move(waypoint0PixelCoords.x, waypoint0PixelCoords.y);

        await waitForWaypointsEventState("hover");
        expect(await getHoveredTopFeature()).toMatchObject({
            ...waypointFeature,
            properties: { id, eventState: "hover" }
        });

        await page.mouse.click(waypoint0PixelCoords.x, waypoint0PixelCoords.y);
        await waitForWaypointsEventState("click");
        expect(await getClickedTopFeature()).toMatchObject({
            ...waypointFeature,
            properties: { id, eventState: "click" }
        });

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Hovering and clicking on multiple waypoints", async () => {
        await setupWaypointsClickHandlers();
        await setupWaypointsHoverHandlers();

        const waypoint1Feature: Waypoint = {
            id: "waypoint1",
            type: "Feature",
            geometry: { type: "Point", coordinates: waypoint1Coords },
            properties: {}
        };

        await showWaypoints([waypoint0Coords, waypoint1Feature, waypoint2Coords]);
        await waitForMapIdle();
        const displayWaypoints = await getDisplayWaypoints();
        const shownWaypointIds = displayWaypoints.features.map((waypoint: Waypoint) => waypoint.id) as string[];

        const waitForEventStates = async (
            state0: EventType | undefined,
            state1: EventType | undefined,
            state2: EventType | undefined
        ) => {
            await waitForWaypointsEventState(state0, shownWaypointIds[0]);
            await waitForWaypointsEventState(state1, shownWaypointIds[1]);
            await waitForWaypointsEventState(state2, shownWaypointIds[2]);
        };

        const waypoint0PixelCoords = await getPixelCoords(waypoint0Coords);
        const waypoint1PixelCoords = await getPixelCoords(waypoint1Coords);
        const waypoint2PixelCoords = await getPixelCoords(waypoint2Coords);

        // We hover on each waypoint:
        await page.mouse.move(waypoint0PixelCoords.x, waypoint0PixelCoords.y);
        await waitForEventStates("hover", undefined, undefined);
        expect(await getNumHoversAndLongHovers()).toEqual([1, 0]);

        await page.mouse.move(waypoint1PixelCoords.x, waypoint1PixelCoords.y);
        await waitForEventStates(undefined, "hover", undefined);
        expect(await getNumHoversAndLongHovers()).toEqual([2, 0]);

        await page.mouse.move(waypoint2PixelCoords.x, waypoint2PixelCoords.y);
        await waitForEventStates(undefined, undefined, "hover");
        expect(await getNumHoversAndLongHovers()).toEqual([3, 0]);
        // waiting in last waypoint until long-hover:
        await waitForEventStates(undefined, undefined, "long-hover");
        expect(await getNumHoversAndLongHovers()).toEqual([3, 1]);

        // Now we click on each waypoint:
        await page.mouse.click(waypoint0PixelCoords.x, waypoint0PixelCoords.y);
        await waitForEventStates("click", undefined, undefined);
        expect(await getNumLeftAndRightClicks()).toEqual([1, 0]);

        await page.mouse.click(waypoint1PixelCoords.x, waypoint1PixelCoords.y);
        await waitForEventStates(undefined, "click", undefined);
        expect(await getNumLeftAndRightClicks()).toEqual([2, 0]);

        await page.mouse.click(waypoint2PixelCoords.x, waypoint2PixelCoords.y, { button: "right" });
        await waitForEventStates(undefined, undefined, "contextmenu");
        expect(await getNumLeftAndRightClicks()).toEqual([2, 1]);

        await page.mouse.click(waypoint2PixelCoords.x, waypoint2PixelCoords.y);
        await waitForEventStates(undefined, undefined, "click");
        expect(await getNumLeftAndRightClicks()).toEqual([3, 1]);

        // While the last waypoint is clicked, we hover on the first waypoint:
        await page.mouse.move(waypoint0PixelCoords.x, waypoint0PixelCoords.y);
        // Click states are high priority, so they remain even if hovering elsewhere:
        await waitForEventStates("hover", undefined, "click");

        // Now we hover far away from the waypoints:
        await page.mouse.move(waypoint0PixelCoords.x - 100, waypoint0PixelCoords.y - 100);
        await waitForEventStates(undefined, undefined, "click");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
