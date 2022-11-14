import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import {
    getNumVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapStyleToLoad
} from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import amsterdamGeometryData from "./Geometry.test.data.json";

const initGeometry = async () =>
    page.evaluate(() => {
        const goSDKThis = globalThis as GOSDKThis;
        goSDKThis.geometry = new goSDKThis.GOSDK.Geometry(goSDKThis.goSDKMap);
    });

const getNumVisibleLayers = async () => getNumVisibleLayersBySource("LOCATION_GEOMETRY");

const clearGeometry = async () => page.evaluate(() => (globalThis as GOSDKThis).geometry?.clear());

const showGeometry = async (geometry: GeometryDataResponse) =>
    page.evaluate((inputGeometry: GeometryDataResponse) => {
        (globalThis as GOSDKThis).geometry?.show(inputGeometry, true);
    }, geometry);

describe("Geometry integration tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    test("Show geometry in the map", async () => {
        await mapEnv.loadMap({ zoom: 8, center: [4.885097, 52.371014] });
        await initGeometry();
        await waitForMapStyleToLoad();
        expect(await getNumVisibleLayers()).toStrictEqual(0);

        await showGeometry(amsterdamGeometryData as GeometryDataResponse);
        expect(await getNumVisibleLayers()).toStrictEqual(2);

        await clearGeometry();
        expect(await getNumVisibleLayers()).toStrictEqual(0);
    });
});
