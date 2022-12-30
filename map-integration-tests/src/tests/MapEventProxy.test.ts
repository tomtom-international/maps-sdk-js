import { GeometryDataResponse, Places } from "@anw/go-sdk-js/core";
import { MapGeoJSONFeature } from "maplibre-gl";
import {
    MapIntegrationTestEnv,
    waitForMapStyleToLoad,
    waitForTimeout,
    waitUntilRenderedFeatures
} from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import POIs from "./MapEventProxy.test.data.json";
import amsterdamGeometryData from "./GeometryModule.test.data.json";
import { EventType, GeometryModuleConfig } from "map";
import { Position } from "geojson";

const poiCoordinates = POIs.features[0].geometry.coordinates as [number, number];

const getPoiPosition = async () =>
    page.evaluate((coordinates) => (globalThis as GOSDKThis).mapLibreMap.project(coordinates), poiCoordinates);

const getCursor = async () =>
    page.evaluate(() => {
        const goSDKThis = globalThis as GOSDKThis;
        return goSDKThis.goSDKMap.mapLibreMap.getCanvas().style.cursor;
    });

const showPlaces = async (places: Places) =>
    page.evaluate((inputPlaces: Places) => {
        (globalThis as GOSDKThis).places?.show(inputPlaces);
        // @ts-ignore
    }, places);

const setupEventCallbacks = async (eventType: EventType) =>
    page.evaluate(
        (inputEventType: EventType) => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.places?.events.on(inputEventType, (lnglat, features, sourceWithLayers) => {
                goSDKThis._clickedLngLat = lnglat;
                goSDKThis._clickedFeatures = features;
                goSDKThis._clickedSourceWithLayers = sourceWithLayers;
            });
        },
        // @ts-ignore
        eventType
    );

const waitForRenderedPlaces = async (numPlaces: number) =>
    waitUntilRenderedFeatures(["placesSymbols"], numPlaces, 20000);

const waitUntilRenderedGeometry = async (numFeatures: number, position: Position): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeatures(["geometry_Fill"], numFeatures, 3000, position);

const geometryData = amsterdamGeometryData as GeometryDataResponse;

const initGeometry = async (config: GeometryModuleConfig) =>
    page.evaluate(
        (inputGeometry: GeometryDataResponse, inputConfig: GeometryModuleConfig) => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.geometry = new goSDKThis.GOSDK.GeometryModule(goSDKThis.goSDKMap, inputConfig);
            goSDKThis.geometry?.show(inputGeometry);
        },
        // @ts-ignore
        geometryData,
        config
    );

const setupGeoJSONModuleAndPlacesEvents = async () => {
    await waitUntilRenderedGeometry(1, [4.89067, 52.37313]);

    // Initiating Places module
    await page.evaluate(() => {
        const goSDKThis = globalThis as GOSDKThis;
        goSDKThis.places = new goSDKThis.GOSDK.GeoJSONPlaces(goSDKThis.goSDKMap);
    });
    await waitForMapStyleToLoad();
    await showPlaces(POIs as Places);
    await waitForRenderedPlaces(POIs.features.length);

    // Setting up events - We click in the POI and should not have geometry module returned
    // in features parameter
    await setupEventCallbacks("click");

    const poiPosition = await getPoiPosition();
    await page.mouse.click(poiPosition.x, poiPosition.y);
};

describe("EventProxy integration tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    // Reset test variables for each test
    beforeEach(async () => {
        await page.evaluate(() => {
            (globalThis as GOSDKThis)._numOfClicks = 0;
            (globalThis as GOSDKThis)._numOfContextmenuClicks = 0;
            (globalThis as GOSDKThis)._numOfHovers = 0;
            (globalThis as GOSDKThis)._numOfLongHovers = 0;
        });

        await mapEnv.loadMap({
            zoom: 10,
            // Amsterdam center
            center: [4.89067, 52.37313]
        });

        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.places = new goSDKThis.GOSDK.GeoJSONPlaces(goSDKThis.goSDKMap);
        });
        await waitForMapStyleToLoad();

        await showPlaces(POIs as Places);
        await waitForRenderedPlaces(POIs.features.length);
    });

    test("Add click and contextmenu events for POI", async () => {
        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.places?.events.on("click", () => goSDKThis._numOfClicks++);
            goSDKThis.places?.events.on("contextmenu", () => goSDKThis._numOfContextmenuClicks++);
        });

        const POIPosition = await getPoiPosition();
        await page.mouse.click(POIPosition.x, POIPosition.y);
        await page.mouse.click(POIPosition.x, POIPosition.y, { button: "right" });

        const numOfClicks = await page.evaluate(() => (globalThis as GOSDKThis)._numOfClicks);
        const numOfContextmenuClicks = await page.evaluate(() => (globalThis as GOSDKThis)._numOfContextmenuClicks);

        expect(numOfClicks).toBe(1);
        expect(numOfContextmenuClicks).toBe(1);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Add hover and long hover events for POI", async () => {
        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.places?.events.on("hover", () => goSDKThis._numOfHovers++);
            goSDKThis.places?.events.on("long-hover", () => goSDKThis._numOfLongHovers++);
        });

        const poiPosition = await getPoiPosition();
        await page.mouse.move(poiPosition.x, poiPosition.y);
        await waitForTimeout(800);

        let numOfHovers = await page.evaluate(() => (globalThis as GOSDKThis)._numOfHovers);
        let numOfLongHovers = await page.evaluate(() => (globalThis as GOSDKThis)._numOfLongHovers);

        expect(numOfHovers).toBe(1);
        expect(numOfLongHovers).toBe(1);

        // Moving cursor away from POI
        await page.mouse.move(poiPosition.x + 100, poiPosition.y + 100);
        // Moving cursor back to POI
        await page.mouse.move(poiPosition.x, poiPosition.y);
        await waitForTimeout(200);
        // Moving mouse away from POI
        await page.mouse.move(poiPosition.x + 100, poiPosition.y + 100);

        numOfHovers = await page.evaluate(() => (globalThis as GOSDKThis)._numOfHovers);
        numOfLongHovers = await page.evaluate(() => (globalThis as GOSDKThis)._numOfLongHovers);

        expect(numOfHovers).toBe(2);
        expect(numOfLongHovers).toBe(1);

        // Moving cursor away from POI
        await page.mouse.move(poiPosition.x + 100, poiPosition.y + 100);
        // Moving cursor back to POI
        await page.mouse.move(poiPosition.x, poiPosition.y);
        await waitForTimeout(800);

        numOfHovers = await page.evaluate(() => (globalThis as GOSDKThis)._numOfHovers);
        numOfLongHovers = await page.evaluate(() => (globalThis as GOSDKThis)._numOfLongHovers);

        expect(numOfHovers).toBe(3);
        expect(numOfLongHovers).toBe(2);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Callback handler arguments defined", async () => {
        await setupEventCallbacks("click");

        const poiPosition = await getPoiPosition();
        await page.mouse.click(poiPosition.x, poiPosition.y);

        const lntlat = await page.evaluate(() => (globalThis as GOSDKThis)._clickedLngLat);
        const features = await page.evaluate(() => (globalThis as GOSDKThis)._clickedFeatures);
        const sourceWithLayers = await page.evaluate(
            () => (globalThis as GOSDKThis)._clickedSourceWithLayers?.layerSpecs
        );

        expect(lntlat).toMatchObject({
            lng: expect.any(Number),
            lat: expect.any(Number)
        });
        expect(features).toHaveLength(1);
        expect(features).toContainEqual(expect.objectContaining({ type: "Feature" }));
        expect(sourceWithLayers).toHaveLength(1);
        expect(sourceWithLayers).toContainEqual(expect.objectContaining({ source: "places", id: "placesSymbols" }));
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});

describe("EventProxy Configuration", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeEach(async () => {
        await mapEnv.loadPage();
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

    test("Load custom event configuration", async () => {
        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.places = new goSDKThis.GOSDK.GeoJSONPlaces(goSDKThis.goSDKMap);
        });
        await waitForMapStyleToLoad();
        await showPlaces(POIs as Places);
        await waitForRenderedPlaces(POIs.features.length);

        let cursor = await getCursor();
        expect(cursor).toBe("help");

        await page.mouse.down();

        cursor = await getCursor();
        expect(cursor).toBe("crosshair");

        await page.mouse.up();
    });

    test("Not return layer if interactive flag is disabled", async () => {
        // Initiating Geometry module
        await initGeometry({ interactive: false });
        await setupGeoJSONModuleAndPlacesEvents();

        const features = await page.evaluate(() => (globalThis as GOSDKThis)._clickedFeatures);
        expect(features).toHaveLength(1);
        expect(features?.[0].layer.id).toEqual("placesSymbols");
    });

    test("Return layer if interactive flag is enabled", async () => {
        await initGeometry({ interactive: true });
        await setupGeoJSONModuleAndPlacesEvents();

        const features = await page.evaluate(() => (globalThis as GOSDKThis)._clickedFeatures);
        expect(features).toHaveLength(3);
        expect(features?.[0].layer.id).toEqual("placesSymbols");
        expect(features?.[1].layer.id).toEqual("geometry_Fill");
    });
});
