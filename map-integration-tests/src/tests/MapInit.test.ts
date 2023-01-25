import {
    GOSDKMapParams,
    HILLSHADE_SOURCE_ID,
    MapLibreOptions,
    POI_SOURCE_ID,
    VECTOR_TILES_FLOW_SOURCE_ID,
    VECTOR_TILES_INCIDENTS_SOURCE_ID
} from "map";
import {
    isLayerVisible,
    getNumVisibleLayersBySource,
    getVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapReady
} from "./util/MapIntegrationTestEnv";
import mapInitTestData from "./MapInit.test.data.json";
import { GOSDKThis } from "./types/GOSDKThis";

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

    test("Should not have traffic flow and traffic incidents layers source ID when module are excluded", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394]
            },
            {
                exclude: ["traffic_flow", "traffic_incidents"]
            }
        );

        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            /* This will trigger a console.error. Here we are trying to load modules that has been excluded.*/
            goSDKThis.traffic = await goSDKThis.GOSDK.VectorTilesTraffic.init(goSDKThis.goSDKMap, { visible: true });
        });

        await waitForMapReady();

        expect(await getVisibleLayersBySource(VECTOR_TILES_INCIDENTS_SOURCE_ID)).toHaveLength(0);
        expect(await getVisibleLayersBySource(VECTOR_TILES_FLOW_SOURCE_ID)).toHaveLength(0);
        /* The two errors are due to the two modules excluded: traffic_flow and traffic_incidents */
        expect(mapEnv.consoleErrors).toHaveLength(2);
    });

    test("Should not have poi and hillshade layers when they are excluded from the style", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394],
                zoom: 15
            },
            {
                exclude: ["poi", "hillshade"]
            }
        );

        await page.evaluate(async () => {
            const goSDKThis = globalThis as GOSDKThis;
            /* This will trigger a console.error. Here we are trying to load modules that has been excluded.*/
            goSDKThis.hillshade = await goSDKThis.GOSDK.VectorTilesHillshade.init(goSDKThis.goSDKMap, {
                visible: false
            });
            goSDKThis.pois = await goSDKThis.GOSDK.VectorTilePOIs.init(goSDKThis.goSDKMap, { visible: false });
        });

        await waitForMapReady();
        expect(await getVisibleLayersBySource(POI_SOURCE_ID)).toHaveLength(0);
        expect(await getVisibleLayersBySource(HILLSHADE_SOURCE_ID)).toHaveLength(0);
        expect(await isLayerVisible("POI")).toStrictEqual(false);
        expect(mapEnv.consoleErrors).toHaveLength(2);
    });
});
