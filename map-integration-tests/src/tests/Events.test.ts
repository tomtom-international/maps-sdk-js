import { GeometryDataResponse, Places } from "@anw/go-sdk-js/core";
import { MapGeoJSONFeature } from "maplibre-gl";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import placesJSON from "./Events.test.data.json";
import amsterdamGeometryData from "./GeometryModule.test.data.json";
import { Position } from "geojson";
import {
    getPlacesSourceAndLayerIDs,
    initGeometry,
    initPlaces,
    showGeometry,
    showPlaces,
    waitForTimeout,
    waitUntilRenderedFeatures
} from "./util/TestUtils";

const places = placesJSON as Places;
const firstPlacePosition = places.features[0].geometry.coordinates as [number, number];
const geometryData = amsterdamGeometryData as GeometryDataResponse;

const getPixelCoords = async (inputCoordinates: [number, number]) =>
    page.evaluate((coordinates) => (globalThis as MapsSDKThis).mapLibreMap.project(coordinates), inputCoordinates);

const getCursor = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        return mapsSDKThis.tomtomMap.mapLibreMap.getCanvas().style.cursor;
    });

const setupPlacesHoverHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.places?.events.on("hover", () => mapsSDKThis._numOfHovers++);
        mapsSDKThis.places?.events.on("long-hover", () => mapsSDKThis._numOfLongHovers++);
    });

const setupGeometryHoverHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.geometry?.events.on("hover", () => mapsSDKThis._numOfHovers++);
        mapsSDKThis.geometry?.events.on("long-hover", () => mapsSDKThis._numOfLongHovers++);
    });

const setupPlacesClickHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.places?.events.on("click", (lnglat, topFeature, features, sourceWithLayers) => {
            mapsSDKThis._numOfClicks++;
            mapsSDKThis._clickedLngLat = lnglat;
            mapsSDKThis._clickedTopFeature = topFeature;
            mapsSDKThis._clickedFeatures = features;
            mapsSDKThis._clickedSourceWithLayers = sourceWithLayers;
        });
        mapsSDKThis.places?.events.on("contextmenu", () => mapsSDKThis._numOfContextmenuClicks++);
    });

const waitUntilRenderedGeometry = async (numFeatures: number, position: Position): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeatures(["geometry_Fill"], numFeatures, 3000, position);

const getNumHoversAndLongHovers = async (): Promise<[number, number]> =>
    page.evaluate(() => {
        const sdkThis = globalThis as MapsSDKThis;
        return [sdkThis._numOfHovers, sdkThis._numOfLongHovers] as [number, number];
    });

describe("Tests with user events", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    // Reset test variables for each test
    beforeEach(async () => {
        await page.evaluate(() => {
            const mapSDKThis = globalThis as MapsSDKThis;
            mapSDKThis._numOfClicks = 0;
            mapSDKThis._numOfContextmenuClicks = 0;
            mapSDKThis._numOfHovers = 0;
            mapSDKThis._numOfLongHovers = 0;
        });

        await mapEnv.loadMap({
            zoom: 10,
            // Amsterdam center
            center: [4.89067, 52.37313]
        });

        await initPlaces();
        await showPlaces(places);
        await waitUntilRenderedFeatures((await getPlacesSourceAndLayerIDs()).layerIDs, places.features.length, 10000);
    });

    test("Add click and contextmenu events for POI", async () => {
        await setupPlacesClickHandlers();

        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y, { button: "right" });

        const numOfClicks = await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks);
        const numOfContextmenuClicks = await page.evaluate(() => (globalThis as MapsSDKThis)._numOfContextmenuClicks);

        expect(numOfClicks).toBe(1);
        expect(numOfContextmenuClicks).toBe(1);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Hover and long hover states for a place", async () => {
        const ENOUGH_FOR_LONG_HOVER_MS = 1500;
        const NOT_ENOUGH_FOR_LONG_HOVER_MS = 100;

        await setupPlacesHoverHandlers();

        const placePosition = await getPixelCoords(firstPlacePosition);
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForTimeout(ENOUGH_FOR_LONG_HOVER_MS);
        expect(await getNumHoversAndLongHovers()).toEqual([1, 1]);

        // Moving cursor away from the place
        await page.mouse.move(placePosition.x + 50, placePosition.y + 50);
        expect(await getNumHoversAndLongHovers()).toEqual([1, 1]);

        // Moving cursor back to the place
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForTimeout(NOT_ENOUGH_FOR_LONG_HOVER_MS);
        // Only immediate hover event expected:
        expect(await getNumHoversAndLongHovers()).toEqual([2, 1]);
        // Waiting for long hover:
        await waitForTimeout(ENOUGH_FOR_LONG_HOVER_MS);
        expect(await getNumHoversAndLongHovers()).toEqual([2, 2]);

        // Moving away again, verifying nothing changes:
        await page.mouse.move(placePosition.x - 50, placePosition.y - 50);
        expect(await getNumHoversAndLongHovers()).toEqual([2, 2]);
        await waitForTimeout(ENOUGH_FOR_LONG_HOVER_MS);
        expect(await getNumHoversAndLongHovers()).toEqual([2, 2]);

        // Moving cursor back to the place:
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForTimeout(NOT_ENOUGH_FOR_LONG_HOVER_MS);
        expect(await getNumHoversAndLongHovers()).toEqual([3, 2]);
        await waitForTimeout(ENOUGH_FOR_LONG_HOVER_MS);
        expect(await getNumHoversAndLongHovers()).toEqual([3, 3]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Callback handler arguments defined", async () => {
        await setupPlacesClickHandlers();

        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);

        const lngLat = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedLngLat);
        const features = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedFeatures);
        const layerSpecs = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedSourceWithLayers?._layerSpecs);

        expect(lngLat).toMatchObject({
            lng: expect.any(Number),
            lat: expect.any(Number)
        });
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

    test("Events combining different map modules", async () => {
        await initGeometry();
        await initPlaces();
        const placesSourceAndLayerIDs = await getPlacesSourceAndLayerIDs();
        await showGeometry(geometryData);
        await showPlaces(places);
        await waitUntilRenderedGeometry(1, [4.89067, 52.37313]);
        await waitUntilRenderedFeatures(placesSourceAndLayerIDs.layerIDs, placesJSON.features.length, 10000);

        // Setting up handlers for places:
        await setupPlacesClickHandlers();

        // We click in the place and should not have geometry module returned in features parameter
        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        const features = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedFeatures);
        expect(features).toHaveLength(1);
        expect(features?.[0].layer.id).toEqual(placesSourceAndLayerIDs.layerIDs[0]);

        // we register a hover handler for geometries
        await setupGeometryHoverHandlers();
    });
});

describe("Events custom configuration", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    beforeEach(async () => {
        await mapEnv.loadMap(
            {
                zoom: 10,
                // Amsterdam center
                center: [4.89067, 52.37313]
            },
            {
                events: {
                    paddingBox: 20,
                    cursorOnMap: "help",
                    cursorOnMouseDown: "crosshair",
                    cursorOnHover: "wait"
                }
            }
        );
    });

    test("Custom cursor", async () => {
        await initPlaces();
        await showPlaces(places);
        await waitUntilRenderedFeatures(
            (
                await getPlacesSourceAndLayerIDs()
            ).layerIDs,
            placesJSON.features.length,
            15000
        );

        expect(await getCursor()).toBe("help");
        await page.mouse.down();
        expect(await getCursor()).toBe("crosshair");
        await page.mouse.up();
        expect(await getCursor()).toBe("help");

        await setupPlacesHoverHandlers();
    });
});
