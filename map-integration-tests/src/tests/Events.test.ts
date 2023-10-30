import { Position } from "geojson";
import { PolygonFeatures, Place, Places } from "@anw/maps-sdk-js/core";
import { MapGeoJSONFeature } from "maplibre-gl";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import placesJSON from "./Events.test.data.json";
import amsterdamGeometryData from "./GeometriesModule.test.data.json";
import {
    getGeometriesSourceAndLayerIDs,
    getPlacesSourceAndLayerIDs,
    initBasemap,
    initGeometry,
    initPlaces,
    queryRenderedFeatures,
    setStyle,
    showGeometry,
    showPlaces,
    tryBeforeTimeout,
    waitForMapIdle,
    waitForTimeout,
    waitUntilRenderedFeatures
} from "./util/TestUtils";
import { EventType, BASE_MAP_SOURCE_ID } from "map";

const places = placesJSON as Places;
const firstPlacePosition = places.features[0].geometry.coordinates as [number, number];
const geometryData = amsterdamGeometryData as PolygonFeatures;

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
        mapsSDKThis.geometries?.events.on("hover", () => mapsSDKThis._numOfHovers++);
        mapsSDKThis.geometries?.events.on("long-hover", () => mapsSDKThis._numOfLongHovers++);
    });

const setupPlacesClickHandlers = async () =>
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

const deRegisterPlacesClickHandlers = async () =>
    page.evaluate(() => (globalThis as MapsSDKThis).places?.events.off("click"));

const waitUntilRenderedGeometry = async (
    numFeatures: number,
    position: Position,
    layerIDs: string[]
): Promise<MapGeoJSONFeature[]> => waitUntilRenderedFeatures(layerIDs, numFeatures, 3000, position);

const getNumLeftAndRightClicks = async (): Promise<[number, number]> =>
    page.evaluate(() => {
        const sdkThis = globalThis as MapsSDKThis;
        return [sdkThis._numOfClicks, sdkThis._numOfContextmenuClicks] as [number, number];
    });

const getNumHoversAndLongHovers = async (): Promise<[number, number]> =>
    page.evaluate(() => {
        const sdkThis = globalThis as MapsSDKThis;
        return [sdkThis._numOfHovers, sdkThis._numOfLongHovers] as [number, number];
    });

const setupBasemapClickHandlers = async () =>
    page.evaluate(async () => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.baseMap?.events.on("click", (topFeature, lnglat, features, sourceWithLayers) => {
            mapsSDKThis._numOfClicks++;
            mapsSDKThis._clickedTopFeature = topFeature;
            mapsSDKThis._clickedLngLat = lnglat;
            mapsSDKThis._clickedFeatures = features;
            mapsSDKThis._clickedSourceWithLayers = sourceWithLayers;
        });
    });

describe("Tests with user events", () => {
    const mapEnv = new MapIntegrationTestEnv();
    let placesLayerIDs: string[];

    beforeAll(async () => mapEnv.loadPage());

    // Reset test variables for each test
    beforeEach(async () => {
        await page.evaluate(() => {
            const mapSDKThis = globalThis as MapsSDKThis;
            mapSDKThis._clickedTopFeature = undefined;
            mapSDKThis._clickedSourceWithLayers = undefined;
            mapSDKThis._clickedFeatures = undefined;
            mapSDKThis._numOfClicks = 0;
            mapSDKThis._numOfContextmenuClicks = 0;
            mapSDKThis._numOfHovers = 0;
            mapSDKThis._numOfLongHovers = 0;
        });

        await mapEnv.loadMap(
            {
                zoom: 10,
                // Amsterdam center
                center: [4.89067, 52.37313]
            },
            // We use longer-than-default delays to help with unstable resource capacity in CI/CD:
            {
                style: { type: "published", include: ["poi"] },
                events: { longHoverDelayAfterMapMoveMS: 2500, longHoverDelayOnStillMapMS: 2000 }
            }
        );

        await initPlaces();
        await showPlaces(places);
        placesLayerIDs = (await getPlacesSourceAndLayerIDs()).layerIDs;
        await waitForMapIdle();
        await waitUntilRenderedFeatures(placesLayerIDs, places.features.length, 10000);
    });

    const waitForEventState = async (expectedEventState: EventType | undefined): Promise<EventType | undefined> =>
        tryBeforeTimeout(
            async (): Promise<EventType> => {
                let eventState;
                do {
                    await waitForTimeout(100);
                    eventState = (await queryRenderedFeatures(placesLayerIDs))[0]?.properties?.eventState;
                } while (eventState != expectedEventState);
                return eventState;
            },
            `Event state didn't match ${expectedEventState}.`,
            5000
        );

    test("Click and contextmenu events for places", async () => {
        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await waitForEventState(undefined);

        // (we haven't registered click events yet)
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState(undefined);
        expect(await getNumLeftAndRightClicks()).toEqual([0, 0]);

        await setupPlacesClickHandlers();
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState("click");
        expect(await getNumLeftAndRightClicks()).toEqual([1, 0]);

        await page.mouse.click(placePixelCoords.x, placePixelCoords.y, { button: "right" });
        await waitForEventState("contextmenu");
        expect(await getNumLeftAndRightClicks()).toEqual([1, 1]);

        // clicking away:
        await page.mouse.click(placePixelCoords.x - 100, placePixelCoords.y - 100);
        await waitForEventState(undefined);
        expect(await getNumLeftAndRightClicks()).toEqual([1, 1]);

        // de-registering handlers, clicking again and asserting nothing happens:
        await deRegisterPlacesClickHandlers();
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        await waitForEventState(undefined);
        expect(await getNumLeftAndRightClicks()).toEqual([1, 1]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Hover and long hover states for a place", async () => {
        await setupPlacesHoverHandlers();
        const placePosition = await getPixelCoords(firstPlacePosition);
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForEventState("hover");
        // Moving cursor away from the place
        await page.mouse.move(placePosition.x - 100, placePosition.y - 100);
        await waitForEventState(undefined);
        expect(await getNumHoversAndLongHovers()).toEqual([1, 0]);

        // Moving cursor back to the place
        await page.mouse.move(placePosition.x, placePosition.y);
        await waitForEventState("hover");
        // Waiting for a long-hover:
        await waitForTimeout(1000);
        await waitForEventState("long-hover");
        expect(await getNumHoversAndLongHovers()).toEqual([2, 1]);
        // Moving away again:
        await page.mouse.move(placePosition.x - 100, placePosition.y - 100);
        await waitForEventState(undefined);
        expect(await getNumHoversAndLongHovers()).toEqual([2, 1]);

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Callback handler arguments", async () => {
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
        await showGeometry(geometryData);
        const geometrySourcesAndLayerIDs = await getGeometriesSourceAndLayerIDs();
        await waitUntilRenderedGeometry(
            1,
            [4.89067, 52.37313],
            geometrySourcesAndLayerIDs?.geometry.layerIDs as string[]
        );

        // Setting up handlers for places:
        await setupPlacesClickHandlers();

        // We click in the place and should not have geometry module returned in features parameter
        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        const features = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedFeatures);
        expect(features).toHaveLength(1);
        expect(features?.[0].layer.id).toEqual(placesLayerIDs[0]);

        // we register a hover handler for geometries
        await setupGeometryHoverHandlers();
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Events combining BaseMap module", async () => {
        await initBasemap();
        // changing the style in between, to double-check we can still register to events in base map after:
        await setStyle("monoLight");
        await waitForMapIdle();
        await setupBasemapClickHandlers();

        // Click on a POI and gets the under layer from basemap as we don't have a event register por Places.
        const placePosition = await getPixelCoords(firstPlacePosition);
        await page.mouse.click(placePosition.x, placePosition.y);
        const topBaseMapFeature = (await page.evaluate(
            () => (globalThis as MapsSDKThis)._clickedTopFeature
        )) as MapGeoJSONFeature;
        expect(topBaseMapFeature?.source).toBe(BASE_MAP_SOURCE_ID);

        await setupPlacesClickHandlers();

        await page.mouse.click(placePosition.x, placePosition.y);
        const topPlaceFeature = (await page.evaluate(() => (globalThis as MapsSDKThis)._clickedTopFeature)) as Place;
        expect(topPlaceFeature).toEqual({
            ...places.features[0],
            properties: {
                ...places.features[0].properties,
                eventState: "click",
                iconID: "159_pin",
                title: "H32 Sportfondsenbad Amsterdam-Oost",
                id: expect.anything()
            }
        });
        expect(mapEnv.consoleErrors).toHaveLength(0);
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
                style: { type: "published", include: ["poi"] },
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
        await waitForMapIdle();
        await waitUntilRenderedFeatures(
            (
                await getPlacesSourceAndLayerIDs()
            ).layerIDs,
            placesJSON.features.length,
            10000
        );

        expect(await getCursor()).toBe("help");
        await page.mouse.down();
        expect(await getCursor()).toBe("crosshair");
        await page.mouse.up();
        expect(await getCursor()).toBe("help");

        await setupPlacesHoverHandlers();
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
