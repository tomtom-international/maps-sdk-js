import type { Places } from "@anw/maps-sdk-js/core";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import {
    getCursor,
    getNumHoversAndLongHovers,
    getNumLeftAndRightClicks,
    getPixelCoords,
    getPlacesSourceAndLayerIDs,
    initPlaces,
    setStyle,
    showPlaces,
    waitForEventState,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures
} from "./util/TestUtils";
import placesJSON from "./data/PlacesModuleEvents.test.data.json";
import type { MapsSDKThis } from "./types/MapsSDKThis";

const deRegisterPlacesClickHandlers = async () =>
    page.evaluate(() => (globalThis as MapsSDKThis).places?.events.off("click"));

const setupPlacesHoverHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.places?.events.on("hover", () => mapsSDKThis._numOfHovers++);
        mapsSDKThis.places?.events.on("long-hover", () => mapsSDKThis._numOfLongHovers++);
    });

const setupPlacesClickHandler = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.places?.events.on("click", (topFeature, lnglat, features, sourceWithLayers) => {
            mapsSDKThis._numOfClicks++;
            mapsSDKThis._clickedTopFeature = topFeature;
            mapsSDKThis._clickedLngLat = lnglat;
            mapsSDKThis._clickedFeatures = features;
            mapsSDKThis._clickedSourceWithLayers = sourceWithLayers;
        });
        mapsSDKThis.places?.events.on("contextmenu", () => mapsSDKThis._numOfContextmenuClicks++);
    });

const places = placesJSON as Places;
const firstPlacePosition = places.features[0].geometry.coordinates as [number, number];

describe("Tests with user events related to PlacesModule", () => {
    const mapEnv = new MapIntegrationTestEnv();
    beforeAll(async () => mapEnv.loadPage());

    // Reset test variables for each test
    beforeEach(async () => {
        await mapEnv.loadMap(
            { zoom: 10, center: [4.89067, 52.34313] }, // Amsterdam center
            {
                // We use longer-than-default delays to help with unstable resource capacity in CI/CD:
                events: { longHoverDelayAfterMapMoveMS: 3500, longHoverDelayOnStillMapMS: 3000 }
            }
        );
    });

    test("Click and contextmenu events for places", async () => {
        await initPlaces();
        await showPlaces(places);
        await waitForMapIdle();
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs()).layerIDs;
        await waitUntilRenderedFeatures(placesLayerIDs, places.features.length, 5000);

        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await waitForEventState(undefined, placesLayerIDs);

        // (we haven't registered click events yet)
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState(undefined, placesLayerIDs);
        expect(await getNumLeftAndRightClicks()).toEqual([0, 0]);

        await setupPlacesClickHandler();
        await waitForTimeout(1000);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState("click", placesLayerIDs);
        expect(await getNumLeftAndRightClicks()).toEqual([1, 0]);

        await page.mouse.click(placePixelCoords.x, placePixelCoords.y, { button: "right" });
        await waitForEventState("contextmenu", placesLayerIDs);
        expect(await getNumLeftAndRightClicks()).toEqual([1, 1]);

        // clicking away:
        await page.mouse.click(placePixelCoords.x - 100, placePixelCoords.y - 100);
        await waitForEventState(undefined, placesLayerIDs);
        expect(await getNumLeftAndRightClicks()).toEqual([1, 1]);

        // unregistering handlers, clicking again and asserting nothing happens:
        await deRegisterPlacesClickHandlers();
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState(undefined, placesLayerIDs);
        expect(await getNumLeftAndRightClicks()).toEqual([1, 1]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Hover and long hover states for a place", async () => {
        await initPlaces();
        await waitForMapIdle();
        const placePosition = await getPixelCoords(firstPlacePosition);
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs()).layerIDs;
        await showPlaces(places);
        await waitForMapIdle();
        await waitUntilRenderedFeatures(placesLayerIDs, places.features.length, 5000);

        await setupPlacesHoverHandlers();
        expect(await getNumHoversAndLongHovers()).toEqual([0, 0]);

        // Moving cursor over the place (hovering)
        await page.mouse.move(placePosition.x, placePosition.y);
        expect(await getNumHoversAndLongHovers()).toEqual([1, 0]);
        await waitForEventState("hover", placesLayerIDs);

        // Moving cursor away from the place
        await page.mouse.move(placePosition.x - 100, placePosition.y - 75);
        expect(await getNumHoversAndLongHovers()).toEqual([1, 0]);
        await waitForEventState(undefined, placesLayerIDs);
        // double-checking we still have the same number of rendered places:
        await waitUntilRenderedFeatures(placesLayerIDs, places.features.length, 3000);

        // Moving the cursor back to the place
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForEventState("hover", placesLayerIDs);
        // Waiting for a long-hover:
        await waitForTimeout(3000);
        await waitForEventState("long-hover", placesLayerIDs);
        expect(await getNumHoversAndLongHovers()).toEqual([2, 1]);

        // Moving away again:
        await page.mouse.move(placePosition.x - 100, placePosition.y - 75);
        await waitForEventState(undefined, placesLayerIDs);
        expect(await getNumHoversAndLongHovers()).toEqual([2, 1]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    // eslint-disable-next-line jest/expect-expect
    test("Hover events for a place shown after changing map style", async () => {
        // This is a "stress" test to ensure events keep functioning properly after changing styles, restoring places, etc.
        await initPlaces();
        await setupPlacesClickHandler();
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs()).layerIDs;
        await setStyle("standardDark");

        // We show the places after the map style has changed.
        // Now we'll test whether the events still work properly
        // (internally meaning that the source and layers proper reference is still in the events proxy when restoring the PlacesModule after the style change):
        await showPlaces(places);
        await waitForMapIdle();
        const placePosition = await getPixelCoords(firstPlacePosition);
        await waitUntilRenderedFeatures(placesLayerIDs, places.features.length, 3000);
        // Moving cursor over the place (hovering)
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForEventState("hover", placesLayerIDs);
        // double-checking we still have the same number of rendered places:
        await waitUntilRenderedFeatures(placesLayerIDs, places.features.length, 3000);
    });

    test("Callback handler arguments", async () => {
        await initPlaces();
        await showPlaces(places);
        await waitForMapIdle();
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs()).layerIDs;
        await waitUntilRenderedFeatures(placesLayerIDs, places.features.length, 5000);

        await setupPlacesClickHandler();

        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);

        const lngLat = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedLngLat);
        const features = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedFeatures);
        const layerSpecs = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedSourceWithLayers?._layerSpecs);

        expect(lngLat).toMatchObject({ lng: expect.any(Number), lat: expect.any(Number) });
        expect(features).toHaveLength(1);
        expect(features).toContainEqual(expect.objectContaining({ type: "Feature" }));
        expect(layerSpecs).toHaveLength(2);
        const { sourceID, layerIDs } = await getPlacesSourceAndLayerIDs();
        expect(layerSpecs).toEqual([
            expect.objectContaining({ source: sourceID, id: layerIDs[0] }),
            expect.objectContaining({ source: sourceID, id: layerIDs[1] })
        ]);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

describe("Events custom configuration", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test("Custom cursor", async () => {
        // Amsterdam center
        await mapEnv.loadMap(
            { zoom: 10, center: [4.89067, 52.37313] },
            {
                events: {
                    cursorOnMap: "help",
                    cursorOnMouseDown: "crosshair",
                    cursorOnHover: "wait"
                }
            }
        );

        await initPlaces();
        await showPlaces(places);
        await waitForMapIdle();
        expect(await getCursor()).toBe("help");
        await page.mouse.down();
        expect(await getCursor()).toBe("crosshair");
        await page.mouse.up();
        expect(await getCursor()).toBe("help");

        await setupPlacesHoverHandlers();
        await waitForTimeout(1000);
        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor()).toBe("wait");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Point precision mode", async () => {
        // Amsterdam center
        await mapEnv.loadMap({ zoom: 10, center: [4.89067, 52.35313] }, { events: { precisionMode: "point" } });

        await initPlaces();
        await showPlaces(places);
        await setupPlacesHoverHandlers();
        await waitForMapIdle();

        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor()).toBe("pointer");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Point-then-box precision mode", async () => {
        // Amsterdam center
        await mapEnv.loadMap(
            { zoom: 10, center: [4.89067, 52.37313] },
            { events: { precisionMode: "point-then-box" } }
        );

        await initPlaces();
        await setupPlacesHoverHandlers();
        await showPlaces(places);
        await waitForMapIdle();

        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor()).toBe("pointer");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
