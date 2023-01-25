import { Map } from "maplibre-gl";
import { AbstractMapModule } from "../AbstractMapModule";
import { VectorTileMapModuleConfig } from "../types";
import { GOSDKMap } from "../../GOSDKMap";
import { waitUntilMapIsReady } from "../../utils/mapUtils";
import Mock = jest.Mock;

describe("AbstractMapModule tests", () => {
    class TestModule extends AbstractMapModule<VectorTileMapModuleConfig> {
        initCalled?: boolean;
        initConfig?: unknown;

        private constructor(goSDKMap: GOSDKMap, config?: VectorTileMapModuleConfig) {
            super(goSDKMap, config);
            this.initCalled = true;
            this.initConfig = config;
        }

        // exposing protected method for testing:
        getMergedConfig(config?: VectorTileMapModuleConfig): VectorTileMapModuleConfig | undefined {
            return super.getMergedConfig(config);
        }

        // Implement events, however it is not tested here.
        get events(): any {
            return jest.fn();
        }

        static async init(goSDKMap: GOSDKMap, config?: VectorTileMapModuleConfig): Promise<TestModule> {
            await waitUntilMapIsReady(goSDKMap);
            return new TestModule(goSDKMap, config);
        }
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
        expect(testModule.initCalled).toStrictEqual(true);
        expect(testModule.initConfig).toBeUndefined();

        // Repeating test with config ----------------------:
        const testConfig = { visible: false };
        (goSDKMapMock.mapLibreMap.isStyleLoaded as Mock).mockClear();
        testModule = await TestModule.init(goSDKMapMock, testConfig);
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(testModule.initCalled).toStrictEqual(true);
        expect(testModule.initConfig).toStrictEqual(testConfig);
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

        expect(testModule.initCalled).toStrictEqual(true);
        expect(testModule.initConfig).toBeUndefined();

        // Repeating test with config -----------------------:
        (goSDKMapMock.mapLibreMap.isStyleLoaded as Mock).mockClear();
        (goSDKMapMock.mapLibreMap.once as Mock).mockClear();

        const testConfig = { visible: false };
        testModule = await TestModule.init(goSDKMapMock, testConfig);
        styleDataEventCallback = (goSDKMapMock.mapLibreMap.once as Mock).mock.calls[0][1];
        styleDataEventCallback();

        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(goSDKMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata", styleDataEventCallback);

        expect(testModule.initCalled).toStrictEqual(true);
        expect(testModule.initConfig).toStrictEqual(testConfig);
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

        expect(testModule.initCalled).toStrictEqual(true);
        expect(testModule.initConfig).toBeUndefined();
    });

    test("Merge config", async () => {
        const goSDKMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(true),
                once: jest.fn((_, callback) => callback())
            } as unknown as Map
        } as GOSDKMap;

        expect((await TestModule.init(goSDKMapMock)).getMergedConfig()).toBeUndefined();
        expect((await TestModule.init(goSDKMapMock)).getMergedConfig({ visible: false })).toStrictEqual({
            visible: false
        });
        expect(
            (await TestModule.init(goSDKMapMock)).getMergedConfig({
                visible: false,
                foo: "bar"
            } as VectorTileMapModuleConfig)
        ).toStrictEqual({ visible: false, foo: "bar" });
        expect((await TestModule.init(goSDKMapMock, { visible: true })).getMergedConfig()).toStrictEqual({
            visible: true
        });
        expect(
            (await TestModule.init(goSDKMapMock, { visible: true })).getMergedConfig({ visible: false })
        ).toStrictEqual({
            visible: false
        });

        // Similar testing but keeping instance:
        const testModuleWithoutConfig = await TestModule.init(goSDKMapMock);
        expect(testModuleWithoutConfig.getMergedConfig({ visible: false })).toStrictEqual({ visible: false });
        expect(testModuleWithoutConfig.getMergedConfig()).toBeUndefined();

        const testModuleWithConfig = await TestModule.init(goSDKMapMock, { visible: false });
        expect(testModuleWithConfig.getMergedConfig({ visible: false })).toStrictEqual({ visible: false });
        expect(testModuleWithConfig.getMergedConfig({ visible: true })).toStrictEqual({ visible: true });
        expect(testModuleWithConfig.getMergedConfig()).toStrictEqual({ visible: false });
    });
});
