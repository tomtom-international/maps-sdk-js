import { GOSDKMapParams, MapLibreOptions } from "map";
import { MapIntegrationTestEnv } from "./MapIntegrationTestEnv";
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
            await mapEnv.waitForMapToLoad();
            expect(await mapEnv.getNumVisibleLayersBySource("vectorTilesIncidents")).toBeGreaterThan(0);
            expect(await mapEnv.getNumVisibleLayersBySource("vectorTilesFlow")).toBeGreaterThan(0);
            expect(await mapEnv.getNumVisibleLayersBySource("poiTiles")).toBeGreaterThan(0);
            expect(await mapEnv.getNumVisibleLayersBySource("hillshade")).toBeGreaterThan(0);
            expect(mapEnv.consoleErrors).toHaveLength(0);
        }
    );
});
