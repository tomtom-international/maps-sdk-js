import { GOSDKMapParams, MapLibreOptions } from "map";
import {
    getNumVisibleLayersBySource,
    getVisibleLayersBySource,
    MapIntegrationTestEnv,
    waitForMapStyleToLoad
} from "./util/MapIntegrationTestEnv";
import mapInitTestData from "./MapInit.test.data.json";
import { GOSDKThis } from "./types/GOSDKThis";

describe("Map Init tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    test.each(mapInitTestData)(
        `'%s`,
        // @ts-ignore
        async (_name: string, mapLibreOptions: MapLibreOptions, goSDKParams: GOSDKMapParams) => {
            await mapEnv.loadMap(mapLibreOptions, goSDKParams);
            await waitForMapStyleToLoad();
            expect(await getNumVisibleLayersBySource("vectorTilesIncidents")).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource("vectorTilesFlow")).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource("poiTiles")).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource("hillshade")).toBeGreaterThan(0);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );

    test("Should not have traffic flow and traffic incidents layers source ID when module are excluded", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394]
            },
            {
                style: "monoLight",
                exclude: ["traffic_flow", "traffic_incidents"]
            }
        );

        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = new goSDKThis.GOSDK.VectorTilesTraffic(goSDKThis.goSDKMap, { visible: true });
        });

        await waitForMapStyleToLoad();

        expect(mapEnv.consoleErrors).toHaveLength(2);
        expect(await getVisibleLayersBySource("vectorTilesIncidents")).toHaveLength(0);
        expect(await getVisibleLayersBySource("vectorTilesFlow")).toHaveLength(0);
    });

    test("Should not have poi and hillshade layers source ID when module are excluded", async () => {
        await mapEnv.loadMap(
            {
                center: [-0.12621, 51.50394]
            },
            {
                style: "monoLight",
                exclude: ["poi", "hillshade"]
            }
        );

        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.hillshade = new goSDKThis.GOSDK.VectorTilesHillshade(goSDKThis.goSDKMap, { visible: false });
            goSDKThis.pois = new goSDKThis.GOSDK.VectorTilePOIs(goSDKThis.goSDKMap, { visible: false });
        });

        await waitForMapStyleToLoad();
        expect(await getVisibleLayersBySource("poiTiles")).toHaveLength(0);
        expect(await getVisibleLayersBySource("hillshade")).toHaveLength(0);
        expect(mapEnv.consoleErrors).toHaveLength(2);
    });
});
