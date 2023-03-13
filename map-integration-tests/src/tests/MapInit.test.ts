import {
    GOSDKMapParams,
    HILLSHADE_SOURCE_ID,
    MapLibreOptions,
    POI_SOURCE_ID,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID
} from "map";
import { MapIntegrationTestEnv } from "./util/MapIntegrationTestEnv";
import mapInitTestData from "./MapInit.test.data.json";
import {
    getNumVisibleLayersBySource,
    getVisibleLayersBySource,
    isLayerVisible,
    waitForMapReady
} from "./util/TestUtils";

describe("Map Init tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => mapEnv.loadPage());

    test.each(mapInitTestData)(
        `'%s`,
        // @ts-ignore
        async (_name: string, mapLibreOptions: MapLibreOptions, goSDKParams: GOSDKMapParams) => {
            await mapEnv.loadMap(mapLibreOptions, goSDKParams);
            await waitForMapReady();
            expect(await getNumVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource(POI_SOURCE_ID)).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toBeGreaterThan(0);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );

    test("Excluding all traffic from the style", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394]
            },
            {
                style: { exclude: ["traffic_flow", "traffic_incidents"] }
            }
        );

        await waitForMapReady();

        expect(await getVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID)).toHaveLength(0);
        expect(await getVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID)).toHaveLength(0);
        expect((await getVisibleLayersBySource(POI_SOURCE_ID)).length).toBeGreaterThan(0);
        expect((await getVisibleLayersBySource(HILLSHADE_SOURCE_ID)).length).toBeGreaterThan(0);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Excluding traffic flow from the style", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394]
            },
            {
                style: { exclude: ["traffic_flow"] }
            }
        );

        await waitForMapReady();

        expect((await getVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID)).length).toBeGreaterThan(0);
        expect(await getVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID)).toHaveLength(0);
        expect((await getVisibleLayersBySource(POI_SOURCE_ID)).length).toBeGreaterThan(0);
        expect((await getVisibleLayersBySource(HILLSHADE_SOURCE_ID)).length).toBeGreaterThan(0);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });

    test("Excluding POIs and hillshade from the style", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394],
                zoom: 15
            },
            {
                style: { exclude: ["poi", "hillshade"] }
            }
        );

        await waitForMapReady();
        expect(await getVisibleLayersBySource(POI_SOURCE_ID)).toHaveLength(0);
        expect(await getVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toHaveLength(0);
        expect((await getVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID)).length).toBeGreaterThan(0);
        expect((await getVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID)).length).toBeGreaterThan(0);
        expect(await isLayerVisible("POI")).toStrictEqual(false);
        expect(mapEnv.consoleErrors).toHaveLength(0);
    });
});
