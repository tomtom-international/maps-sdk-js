import type { Position } from "geojson";
import type { Place, Places, PolygonFeatures } from "@anw/maps-sdk-js/core";
import type { MapGeoJSONFeature } from "maplibre-gl";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import type { MapsSDKThis } from "./types/MapsSDKThis";
import placesJSON from "./data/PlacesModuleEvents.test.data.json";
import amsterdamGeometryData from "./data/GeometriesModule.test.data.json";
import {
    getClickedTopFeature,
    getGeometriesSourceAndLayerIDs,
    getPixelCoords,
    getPlacesSourceAndLayerIDs,
    initBasemap,
    initGeometries,
    initPlaces,
    setStyle,
    showGeometry,
    showPlaces,
    waitForMapIdle,
    waitUntilRenderedFeatures
} from "./util/TestUtils";
import { BASE_MAP_SOURCE_ID } from "map";

const places = placesJSON as Places;
const firstPlacePosition = places.features[0].geometry.coordinates as [number, number];
const geometryData = amsterdamGeometryData as PolygonFeatures;

const setupGeometryHoverHandlers = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.geometries?.events.on("hover", () => mapsSDKThis._numOfHovers++);
        mapsSDKThis.geometries?.events.on("long-hover", () => mapsSDKThis._numOfLongHovers++);
    });

const setupPlacesClickHandler = async () =>
    page.evaluate(() => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.places?.events.on("click", (topFeature, _, features) => {
            mapsSDKThis._clickedTopFeature = topFeature;
            mapsSDKThis._clickedFeatures = features;
        });
        mapsSDKThis.places?.events.on("contextmenu", () => mapsSDKThis._numOfContextmenuClicks++);
    });

const waitUntilRenderedGeometry = async (
    numFeatures: number,
    position: Position,
    layerIDs: string[]
): Promise<MapGeoJSONFeature[]> => waitUntilRenderedFeatures(layerIDs, numFeatures, 3000, position);

const setupBasemapClickHandler = async () =>
    page.evaluate(async () => {
        const mapsSDKThis = globalThis as MapsSDKThis;
        mapsSDKThis.baseMap?.events.on("click", (topFeature, _, features) => {
            mapsSDKThis._clickedTopFeature = topFeature;
            mapsSDKThis._clickedFeatures = features;
        });
    });

describe("Tests with user events", () => {
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

    test("Events combining different map modules", async () => {
        await initGeometries();
        await showGeometry(geometryData);
        const geometrySourcesAndLayerIDs = await getGeometriesSourceAndLayerIDs();
        await waitUntilRenderedGeometry(
            1,
            [4.89067, 52.37313],
            geometrySourcesAndLayerIDs?.geometry.layerIDs as string[]
        );

        await initPlaces();
        await showPlaces(places);
        await waitForMapIdle();
        const placesLayerIDs = (await getPlacesSourceAndLayerIDs()).layerIDs;
        await waitUntilRenderedFeatures(placesLayerIDs, places.features.length, 5000);
        // Setting up handlers for places:
        await setupPlacesClickHandler();

        // We click in the place and should not have a geometry module returned in features parameter
        const placePixelCoords = await getPixelCoords(firstPlacePosition);
        await page.mouse.click(placePixelCoords.x, placePixelCoords.y);
        const features = await page.evaluate(() => (globalThis as MapsSDKThis)._clickedFeatures);
        expect(features).toHaveLength(1);
        expect(features?.[0].layer.id).toEqual(placesLayerIDs[0]);

        // we register a hover handler for geometries
        await setupGeometryHoverHandlers();
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Events with Places and BaseMap modules", async () => {
        await initBasemap();
        await initPlaces();
        await showPlaces(places);
        await waitForMapIdle();

        // changing the style in between, to double-check that we can still register to events in base map after:
        await setStyle("monoLight");
        await waitForMapIdle();
        await setupBasemapClickHandler();

        // Click on a POI and gets the under layer from basemap as we don't have a event register por Places.
        const placePosition = await getPixelCoords(firstPlacePosition);
        await page.mouse.click(placePosition.x, placePosition.y);
        const topBaseMapFeature = await getClickedTopFeature();
        expect(topBaseMapFeature?.source).toBe(BASE_MAP_SOURCE_ID);

        await setupPlacesClickHandler();

        await page.mouse.click(placePosition.x, placePosition.y);
        const topPlaceFeature = await getClickedTopFeature<Place>();
        expect(topPlaceFeature).toEqual({
            ...places.features[0],
            properties: {
                ...places.features[0].properties,
                eventState: "click",
                iconID: "poi-parking_facility",
                title: "H32 Sportfondsenbad Amsterdam-Oost",
                id: expect.anything()
            }
        });
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
