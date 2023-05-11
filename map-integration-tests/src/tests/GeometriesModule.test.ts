import { Geometries } from "@anw/maps-sdk-js/core";

import { DisplayGeometryProps, GeometryBeforeLayerConfig, mapStyleLayerIDs } from "map";
import { LngLatBoundsLike, MapGeoJSONFeature } from "maplibre-gl";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import amsterdamGeometryData from "./GeometriesModule.test.data.json";
import netherlandsGeometryData from "./GeometriesModule-Netherlands.test.data.json";
import { GeoJsonProperties, Position } from "geojson";
import {
    getGeometriesSourceAndLayerIDs,
    getNumVisibleLayersBySource,
    getLayerByID,
    initGeometry,
    queryRenderedFeatures,
    setStyle,
    showGeometry,
    waitForMapIdle,
    waitForMapReady,
    waitUntilRenderedFeatures
} from "./util/TestUtils";

const getNumVisibleLayers = async (sourceID: string) => getNumVisibleLayersBySource(sourceID);

const getNumVisibleTitleLayers = async (sourceID: string) => getNumVisibleLayersBySource(sourceID);

const clearGeometry = async () => page.evaluate(() => (globalThis as MapsSDKThis).geometries?.clear());

const moveBeforeLayer = async (config: GeometryBeforeLayerConfig) =>
    page.evaluate((inputConfig) => (globalThis as MapsSDKThis).geometries?.moveBeforeLayer(inputConfig), config);

const getAllLayers = async () => page.evaluate(() => (globalThis as MapsSDKThis).mapLibreMap.getStyle().layers);

const waitUntilRenderedGeometry = async (
    numFeatures: number,
    position: Position,
    layerIDs: string[]
): Promise<MapGeoJSONFeature[]> => waitUntilRenderedFeatures(layerIDs, numFeatures, 3000, position);

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
        const sourcesAndLayers = await getGeometriesSourceAndLayerIDs();
        const sourceID = sourcesAndLayers?.geometry?.sourceID as string;
        await waitForMapReady();
        expect(await getNumVisibleLayers(sourceID)).toBe(0);

        await showGeometry(geometryData);
        expect(await getNumVisibleLayers(sourceID)).toBe(2);
        // non-inverted polygon: fills inside but not the edges:
        const layerIDs = sourcesAndLayers?.geometry?.layerIDs as string[];
        await waitUntilRenderedGeometry(1, amsterdamCenter, layerIDs);
        await waitUntilRenderedGeometry(1, amsterdamSouthEast, layerIDs);
        await waitUntilRenderedGeometry(0, outsideAmsterdamNorth, layerIDs);
        await waitUntilRenderedGeometry(0, outsideAmsterdamSouth, layerIDs);

        await clearGeometry();
        expect(await getNumVisibleLayers(sourceID)).toBe(0);
        await showGeometry(geometryData);
        expect(await getNumVisibleLayers(sourceID)).toBe(2);
    });

    test("Show multiple geometries in the map with title, default config", async () => {
        await mapEnv.loadMap({ bounds: netherlandsData.bbox as LngLatBoundsLike });
        await initGeometry();

        const sourcesAndLayers = await getGeometriesSourceAndLayerIDs();
        const sourceID = sourcesAndLayers?.geometry?.sourceID as string;
        const titleSourceID = sourcesAndLayers?.geometryLabel?.sourceID as string;
        const titleLayerIDs = sourcesAndLayers?.geometryLabel?.layerIDs as string[];

        expect(await getNumVisibleLayers(sourceID)).toBe(0);
        await showGeometry(netherlandsData);
        expect(await getNumVisibleLayers(sourceID)).toBe(2);
        expect(await getNumVisibleTitleLayers(titleSourceID)).toBe(1);

        await waitForMapIdle();
        const features = await queryRenderedFeatures(titleLayerIDs);
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
        const sourcesAndLayers = await getGeometriesSourceAndLayerIDs();
        const sourceID = sourcesAndLayers?.geometry?.sourceID as string;
        const layerIDs = sourcesAndLayers?.geometry?.layerIDs as string[];
        const fillLayerID = layerIDs[0];
        const titleSourceID = sourcesAndLayers?.geometryLabel?.sourceID as string;
        const titleLayerIDs = sourcesAndLayers?.geometryLabel?.layerIDs as string[];

        expect(await getNumVisibleLayers(sourceID)).toBe(0);

        await showGeometry(netherlandsData);
        expect(await getNumVisibleLayers(sourceID)).toBe(2);
        expect(await getNumVisibleTitleLayers(titleSourceID)).toBe(1);

        await waitForMapIdle();
        const features = await queryRenderedFeatures(titleLayerIDs);
        expect(features).toHaveLength(12);
        features.forEach((feature) => {
            expect(feature).toMatchObject({ properties: { title: "CustomText", color: "#00ccbb" } });
        });

        const geometryFillLayer = await getLayerByID(fillLayerID);
        // @ts-ignore
        expect(geometryFillLayer.paint["fill-opacity"]).toBe(0.6);

        await moveBeforeLayer("lowestRoadLine");
        let layers = await getAllLayers();
        let geometryIndex = layers.findIndex((feature) => feature.id === fillLayerID);
        let lowestRoadLineIndex = layers.findIndex((feature) => feature.id === mapStyleLayerIDs.lowestRoadLine);
        expect(geometryIndex).toBeLessThan(lowestRoadLineIndex);

        // changing map style and verifying again:
        await setStyle("standardDark");
        await waitForMapIdle();
        layers = await getAllLayers();
        geometryIndex = layers.findIndex((feature) => feature.id === fillLayerID);
        lowestRoadLineIndex = layers.findIndex((feature) => feature.id === mapStyleLayerIDs.lowestRoadLine);
        expect(geometryIndex).toBeLessThan(lowestRoadLineIndex);
    });
});
