import { GOSDKMapParams, MapLibreOptions } from "map";
import { getNumVisibleLayersBySource, MapIntegrationTestEnv, waitForMapToLoad } from "./util/MapIntegrationTestEnv";
import mapInitTestData from "./MapInit.test.data.json";

describe("Map Init tests", () => {
    const mapEnv = new MapIntegrationTestEnv();

    beforeAll(async () => {
        await mapEnv.loadPage();
    });

    test.each(mapInitTestData)(
        `'%s`,
        // @ts-ignore
        async (_name: string, mapLibreOptions: Partial<MapLibreOptions>, goSDKParams: Partial<GOSDKMapParams>) => {
            await mapEnv.loadMap(mapLibreOptions, goSDKParams);
            await waitForMapToLoad();
            expect(await getNumVisibleLayersBySource("vectorTilesIncidents")).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource("vectorTilesFlow")).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource("poiTiles")).toBeGreaterThan(0);
            expect(await getNumVisibleLayersBySource("hillshade")).toBeGreaterThan(0);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );
});
