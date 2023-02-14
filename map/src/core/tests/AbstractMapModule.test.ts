import { Map } from "maplibre-gl";
import { AbstractMapModule } from "../AbstractMapModule";
import { VectorTileMapModuleConfig } from "../types";
import { GOSDKMap } from "../../GOSDKMap";
import { waitUntilMapIsReady } from "../../utils/mapUtils";
import Mock = jest.Mock;
import { EventsModule } from "../EventsModule";

describe("AbstractMapModule tests", () => {
    class TestModule extends AbstractMapModule<VectorTileMapModuleConfig> {
        initCalled?: boolean;
        configApplied?: VectorTileMapModuleConfig | null;

        static async init(goSDKMap: GOSDKMap, config?: VectorTileMapModuleConfig): Promise<TestModule> {
            await waitUntilMapIsReady(goSDKMap);
            return new TestModule(goSDKMap, config);
        }

        protected initSourcesWithLayers(): void {
            this.initCalled = true;
        }

        protected _applyConfig(config: VectorTileMapModuleConfig | undefined): void {
            this.configApplied = config;
        }

        // Implement events, however it is not tested here.
        // get events(): EventsModule {
        //     return jest.fn() as unknown as EventsModule;
        // }
    }

    test("Constructor with style loaded", async () => {
        const goSDKMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(true),
                once: jest.fn((_, callback) => callback())
            } as unknown as Map
        } as GOSDKMap;

        let testModule = await TestModule.init(goSDKMapMock);
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();

        // Repeating test with config ----------------------:
        const testConfig = { visible: false };
        (goSDKMapMock.mapLibreMap.isStyleLoaded as Mock).mockClear();
        testModule = await TestModule.init(goSDKMapMock, testConfig);
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toStrictEqual(testConfig);
        expect(testModule.getConfig()).toStrictEqual(testConfig);
    });

    test("Constructor with style not loaded yet", async () => {
        const goSDKMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(false),
                once: jest.fn((_, callback) => callback())
            } as unknown as Map
        } as GOSDKMap;

        let testModule = await TestModule.init(goSDKMapMock);
        let styleDataEventCallback = (goSDKMapMock.mapLibreMap.once as Mock).mock.calls[0][1];
        styleDataEventCallback();

        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(goSDKMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata", styleDataEventCallback);

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();

        // Repeating test with config -----------------------:
        (goSDKMapMock.mapLibreMap.isStyleLoaded as Mock).mockClear();
        (goSDKMapMock.mapLibreMap.once as Mock).mockClear();

        const testConfig = { visible: false };
        testModule = await TestModule.init(goSDKMapMock, testConfig);
        styleDataEventCallback = (goSDKMapMock.mapLibreMap.once as Mock).mock.calls[0][1];
        styleDataEventCallback();

        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(goSDKMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata", styleDataEventCallback);

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toStrictEqual(testConfig);
        expect(testModule.getConfig()).toStrictEqual(testConfig);
    });

    test("Constructor with style not loaded yet and style data timeout", async () => {
        const goSDKMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(false),
                once: jest.fn((_, callback) => callback())
            } as unknown as Map
        } as GOSDKMap;

        const testModule = await TestModule.init(goSDKMapMock);
        await new Promise((resolve) => setTimeout(resolve, 6000));
        const styleDataEventCallback = (goSDKMapMock.mapLibreMap.once as Mock).mock.calls[0][1];
        styleDataEventCallback();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(goSDKMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata", styleDataEventCallback);

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();
    });
});
