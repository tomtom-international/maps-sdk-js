import { Point, Position } from "geojson";
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
    initBasemap2,
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

const getPixelCoords = async (inputCoordinates: [number, number] | Position) =>
    page.evaluate(
        (coordinates) => (globalThis as MapsSDKThis).mapLibreMap.project(coordinates as [number, number]),
        inputCoordinates
    );

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
            {
                style: { type: "published", include: ["poi"] },
                // We use longer-than-default delays to help with unstable resource capacity in CI/CD:
                events: { longHoverDelayAfterMapMoveMS: 3000, longHoverDelayOnStillMapMS: 2500 }
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

    test("Events in BaseMap module", async () => {
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

    test("Events from two Base Map modules with mutually exclusive layer groups", async () => {
        await initBasemap({ layerGroups: { mode: "include", names: ["cityLabels"] } });
        await initBasemap2({ layerGroups: { mode: "exclude", names: ["cityLabels"] } });

        const baseMapCityFeature = await getPixelCoords(
            await page.evaluate(
                () =>
                    (
                        (globalThis as MapsSDKThis).mapLibreMap.queryRenderedFeatures(undefined, {
                            layers: ["Places - Large city"]
                        })?.[0].geometry as Point
                    ).coordinates
            )
        );

        // only first base map listens to click events for now:
        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.baseMap?.events.on("click", (topFeature) => {
                mapsSDKThis._numOfClicks++;
                mapsSDKThis._clickedTopFeature = topFeature;
            });
        });

        // we click on the base map place (city label) and verify that the callback is called correctly:
        await page.mouse.click(baseMapCityFeature.x, baseMapCityFeature.y);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(1);
        expect(
            await page.evaluate(() => ((globalThis as MapsSDKThis)._clickedTopFeature as MapGeoJSONFeature)?.layer.id)
        ).toBe("Places - Large city");

        // now we register a click handler for the second base map:
        await page.evaluate(async () => {
            const mapsSDKThis = globalThis as MapsSDKThis;
            mapsSDKThis.baseMap2?.events.on("click", (topFeature) => {
                (mapsSDKThis as any)._numOfClicks2++;
                (mapsSDKThis as any)._clickedTopFeature2 = topFeature;
            });
        });
        await page.evaluate(() => ((globalThis as any)._numOfClicks2 = 0));

        // we click on the city label again. Even if the other base map module also listens to clicks, its layers are below
        // so the first base map is the only one to fire the event:
        await page.mouse.click(baseMapCityFeature.x, baseMapCityFeature.y);
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(2);
        expect(await page.evaluate(() => (globalThis as any)._numOfClicks2)).toBe(0);
        expect(
            await page.evaluate(() => ((globalThis as MapsSDKThis)._clickedTopFeature as MapGeoJSONFeature)?.layer.id)
        ).toBe("Places - Large city");
        expect(await page.evaluate(() => (globalThis as any)._clickedTopFeature2)).toBeUndefined();

        // now we click on an "empty" (non-city) area of the map, and verify that this time the second base map module fires the event:
        await page.mouse.click(baseMapCityFeature.x + 50, baseMapCityFeature.y + 50);
        // no changes in first base map:
        expect(await page.evaluate(() => (globalThis as MapsSDKThis)._numOfClicks)).toBe(2);
        // base map 2 fired the event:
        expect(await page.evaluate(() => (globalThis as any)._numOfClicks2)).toBe(1);
        expect(
            await page.evaluate(() => ((globalThis as any)._clickedTopFeature2 as MapGeoJSONFeature)?.layer.id)
        ).not.toContain("Places");

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
                style: { type: "published", include: ["poi"] },
                events: {
                    paddingBox: 20,
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
        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor()).toBe("wait");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Point precision mode", async () => {
        // Amsterdam center
        await mapEnv.loadMap(
            { zoom: 10, center: [4.89067, 52.37313] },
            {
                style: { type: "published", include: ["poi"] },
                events: { precisionMode: "point" }
            }
        );

        await initPlaces();
        await setupPlacesHoverHandlers();
        await showPlaces(places);
        await waitForMapIdle();

        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor()).toBe("pointer");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Point-then-box precision mode", async () => {
        // Amsterdam center
        await mapEnv.loadMap(
            { zoom: 10, center: [4.89067, 52.37313] },
            {
                style: { type: "published", include: ["poi"] },
                events: { precisionMode: "point-then-box" }
            }
        );

        await initPlaces();
        await setupPlacesHoverHandlers();
        await showPlaces(places);
        await waitForMapIdle();

        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        page.mouse.move(placePixelCoords.x, placePixelCoords.y);

        await waitForTimeout(500);
        expect(await getCursor()).toBe("pointer");

        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
