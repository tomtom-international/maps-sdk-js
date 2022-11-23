import { GOSDKMapParams, MapLibreOptions } from "map";
import {
    getNumVisibleLayersBySource,
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

    test("Show console errors when loading traffic if hide traffic options are set", async () => {
        await mapEnv.loadMap(
            {
                zoom: 12,
                minZoom: 2,
                center: [-0.12621, 51.50394]
            },
            {
                style: "monoLight",
                hide: {
                    trafficFlow: true,
                    trafficIncidents: true
                }
            }
        );

        await page.evaluate(() => {
            const goSDKThis = globalThis as GOSDKThis;
            goSDKThis.traffic = new goSDKThis.GOSDK.VectorTilesTraffic(goSDKThis.goSDKMap, { visible: true });
        });

        await waitForMapStyleToLoad();
        expect(mapEnv.consoleErrors).toHaveLength(2);
    });
});
