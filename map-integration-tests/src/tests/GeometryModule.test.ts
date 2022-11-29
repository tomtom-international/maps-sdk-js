import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import { GeometryModuleConfig, MapLibreBBox } from "map";
import { MapGeoJSONFeature } from "maplibre-gl";
import {
    getNumVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapStyleToLoad,
    waitUntilRenderedFeatures
} from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import amsterdamGeometryData from "./GeometryModule.test.data.json";
import { Position } from "geojson";

const initGeometry = async (config?: GeometryModuleConfig) =>
    page.evaluate(
        (inputConfig: GeometryModuleConfig) => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.geometry = new goSDKThis.GOSDK.GeometryModule(goSDKThis.goSDKMap, inputConfig);
        },
        // @ts-ignore
        config
    );

const getNumVisibleLayers = async () => getNumVisibleLayersBySource("PLACE_GEOMETRY");

const clearGeometry = async () => page.evaluate(() => (globalThis as GOSDKThis).geometry?.clear());

const showGeometry = async (geometry: GeometryDataResponse) =>
    page.evaluate(
        (inputGeometry: GeometryDataResponse) => (globalThis as GOSDKThis).geometry?.show(inputGeometry),
        // @ts-ignore
        geometry
    );

const waitUntilRenderedGeometry = async (numFeatures: number, position: Position): Promise<MapGeoJSONFeature[]> =>
    waitUntilRenderedFeatures("PLACE_GEOMETRY_FILL", numFeatures, 3000, position);

describe("Geometry integration tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    const geometryData = amsterdamGeometryData as GeometryDataResponse;

    const amsterdamCenter = [4.89067, 52.37313];
    // point in Amsterdam South East which fits inside a separate polygon:
    const amsterdamSouthEast = [4.99225, 52.30551];
    const outsideAmsterdamNorth = [4.93236, 52.41518];
    const outsideAmsterdamSouth = [4.8799, 52.3087];

    test("Show geometry in the map, default module config", async () => {
        await mapEnv.loadMap({ bounds: geometryData.bbox as MapLibreBBox });
        await initGeometry();
        await waitForMapStyleToLoad();
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
