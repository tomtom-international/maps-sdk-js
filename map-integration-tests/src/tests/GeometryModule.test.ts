import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { GEOMETRY_SOURCE_ID } from "map";
import { LngLatBoundsLike, MapGeoJSONFeature } from "maplibre-gl";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import { MapsSDKThis } from "./types/MapsSDKThis";
import amsterdamGeometryData from "./GeometryModule.test.data.json";
import { Position } from "geojson";
import {
    getNumVisibleLayersBySource,
    initGeometry,
    showGeometry,
    waitForMapReady,
    waitUntilRenderedFeatures
} from "./util/TestUtils";

const getNumVisibleLayers = async () => getNumVisibleLayersBySource(GEOMETRY_SOURCE_ID);

const clearGeometry = async () => page.evaluate(() => (globalThis as MapsSDKThis).geometry?.clear());

const waitUntilRenderedGeometry = async (numFeatures: number, position: Position): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeatures(["geometry_Fill"], numFeatures, 3000, position);

describe("Geometry integration tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    const geometryData = amsterdamGeometryData as GeometryDataResponse;

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
});
