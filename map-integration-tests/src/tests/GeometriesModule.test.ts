import { Geometries } from "@anw/maps-sdk-js/core";

import {
    DisplayGeometryProps,
    GEOMETRY_SOURCE_ID,
    GEOMETRY_TITLE_SOURCE_ID,
    GeometryBeforeLayerConfig,
    mapStyleLayerIDs
} from "map";
import { LngLatBoundsLike, MapGeoJSONFeature } from "maplibre-gl";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import amsterdamGeometryData from "./GeometriesModule.test.data.json";
import netherlandsGeometryData from "./GeometriesModule-Netherlands.test.data.json";
import { GeoJsonProperties, Position } from "geojson";
import {
    getNumVisibleLayersBySource,
    getSymbolLayersByID,
    initGeometry,
    queryRenderedFeatures,
    setStyle,
    showGeometry,
    waitForMapIdle,
    waitForMapReady,
    waitUntilRenderedFeatures
} from "./util/TestUtils";

const getNumVisibleLayers = async () => getNumVisibleLayersBySource(GEOMETRY_SOURCE_ID);

const getNumVisibleTitleLayers = async () => getNumVisibleLayersBySource(GEOMETRY_TITLE_SOURCE_ID);

const clearGeometry = async () => page.evaluate(() => (globalThis as MapsSDKThis).geometry?.clear());

const moveBeforeLayer = async (config: GeometryBeforeLayerConfig) =>
    page.evaluate((inputConfig) => (globalThis as MapsSDKThis).geometry?.moveBeforeLayer(inputConfig), config);

const getAllLayers = async () => page.evaluate(() => (globalThis as MapsSDKThis).mapLibreMap.getStyle().layers);

const waitUntilRenderedGeometry = async (numFeatures: number, position: Position): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeatures(["geometry_Fill"], numFeatures, 3000, position);

describe("Geometry integration tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    const geometryData = amsterdamGeometryData as Geometries<GeoJsonProperties>;
    const netherlandsData = netherlandsGeometryData as unknown as Geometries<DisplayGeometryProps>;

    const amsterdamCenter = [4.89067, 52.37313];
    // point in Amsterdam South East which fits inside a separate polygon:
    const amsterdamSouthEast = [4.99225, 52.30551];
    const outsideAmsterdamNorth = [4.93236, 52.41518];
    const outsideAmsterdamSouth = [4.8799, 52.3087];

    test("Show geometry in the map, default module config", async () => {
        await mapEnv.loadMap({ bounds: geometryData.bbox as LngLatBoundsLike });
        await initGeometry();
        await waitForMapReady();
        expect(await getNumVisibleLayers()).toStrictEqual(0);

        await showGeometry(geometryData);
        expect(await getNumVisibleLayers()).toStrictEqual(2);
        // non-inverted polygon: fills inside but not the edges:
        await waitUntilRenderedGeometry(1, amsterdamCenter);
        await waitUntilRenderedGeometry(1, amsterdamSouthEast);
        await waitUntilRenderedGeometry(0, outsideAmsterdamNorth);
        await waitUntilRenderedGeometry(0, outsideAmsterdamSouth);

        await clearGeometry();
        expect(await getNumVisibleLayers()).toStrictEqual(0);
        await showGeometry(geometryData);
        expect(await getNumVisibleLayers()).toStrictEqual(2);
    });

    test("Show multiple geometries in the map with title, default config", async () => {
        await mapEnv.loadMap({ bounds: netherlandsData.bbox as LngLatBoundsLike });
        await initGeometry();
        await waitForMapReady();
        expect(await getNumVisibleLayers()).toStrictEqual(0);

        await showGeometry(netherlandsData);
        expect(await getNumVisibleLayers()).toStrictEqual(2);
        expect(await getNumVisibleTitleLayers()).toStrictEqual(1);

        await waitForMapIdle();
        const features = await queryRenderedFeatures(["geometry_Title"]);
        expect(features).toHaveLength(12);
        features.forEach((feature) => {
            expect(feature).toMatchObject({
                properties: { title: JSON.parse(feature.properties.address).freeformAddress }
            });
        });
    });

    test("Show multiple geometries in the map with title, custom config", async () => {
        await mapEnv.loadMap({ bounds: netherlandsData.bbox as LngLatBoundsLike });
        await initGeometry({
            colorConfig: { fillColor: "#00ccbb", fillOpacity: 0.6 },
            textConfig: { textField: "CustomText" }
        });
        await waitForMapReady();
        expect(await getNumVisibleLayers()).toStrictEqual(0);

        await showGeometry(netherlandsData);
        expect(await getNumVisibleLayers()).toStrictEqual(2);
        expect(await getNumVisibleTitleLayers()).toStrictEqual(1);

        await waitForMapIdle();
        const features = await queryRenderedFeatures(["geometry_Title"]);
        expect(features).toHaveLength(12);
        features.forEach((feature) => {
            expect(feature).toMatchObject({ properties: { title: "CustomText", color: "#00ccbb" } });
        });

        const geometryLayer = await getSymbolLayersByID("geometry_Fill");
        // @ts-ignore
        expect(geometryLayer.paint["fill-opacity"]).toBe(0.6);

        await moveBeforeLayer("lowestRoadLine");
        let layers = await getAllLayers();
        let geometryIndex = layers.findIndex((feature) => feature.id === "geometry_Fill");
        let lowestRoadLineIndex = layers.findIndex((feature) => feature.id === mapStyleLayerIDs.lowestRoadLine);
        expect(geometryIndex).toBeLessThan(lowestRoadLineIndex);

        // changing map style and verifying again:
        await setStyle("standardDark");
        await waitForMapIdle();
        layers = await getAllLayers();
        geometryIndex = layers.findIndex((feature) => feature.id === "geometry_Fill");
        lowestRoadLineIndex = layers.findIndex((feature) => feature.id === mapStyleLayerIDs.lowestRoadLine);
        expect(geometryIndex).toBeLessThan(lowestRoadLineIndex);
    });
});
