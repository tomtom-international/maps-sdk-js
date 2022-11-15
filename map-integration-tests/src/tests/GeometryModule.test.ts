import { GeometryDataResponse } from "@anw/go-sdk-js/core";
import {
    getNumVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapStyleToLoad,
    waitForTimeout
} from "./util/MapIntegrationTestEnv";
import { GOSDKThis } from "./types/GOSDKThis";
import amsterdamGeometryData from "./GeometryModule.test.data.json";

const initGeometry = async () =>
    page.evaluate(() => {
        const goSDKThis = globalThis as GOSDKThis;
        goSDKThis.geometry = new goSDKThis.GOSDK.GeometryModule(goSDKThis.goSDKMap);
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
        const geometryData = amsterdamGeometryData as GeometryDataResponse;
        await mapEnv.loadMap({}, { bounds: geometryData });
        await initGeometry();
        await waitForMapStyleToLoad();
        expect(await getNumVisibleLayers()).toStrictEqual(0);

        await showGeometry(geometryData);
        expect(await getNumVisibleLayers()).toStrictEqual(2);

        await waitForTimeout(10000);

        await clearGeometry();
        expect(await getNumVisibleLayers()).toStrictEqual(0);
    });
});
