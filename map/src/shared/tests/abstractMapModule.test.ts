import { Map } from "maplibre-gl";
import { AbstractMapModule } from "../AbstractMapModule";
import { StyleModuleConfig } from "../types";
import { TomTomMap } from "../../TomTomMap";
import { waitUntilMapIsReady } from "../mapUtils";
import Mock = jest.Mock;

describe("AbstractMapModule tests", () => {
    class TestModule extends AbstractMapModule<Record<string, never>, StyleModuleConfig> {
        initCalled?: boolean;
        configApplied?: StyleModuleConfig | null;
        restored?: boolean;

        static async init(tomtomMap: TomTomMap, config?: StyleModuleConfig): Promise<TestModule> {
            await waitUntilMapIsReady(tomtomMap);
            return new TestModule(tomtomMap, config);
        }

        protected _initSourcesWithLayers(): Record<string, never> {
            this.initCalled = true;
            return {};
        }

        protected _applyConfig(config: StyleModuleConfig | undefined) {
            this.configApplied = config;
            return config;
        }

        protected restoreDataAndConfig() {
            this.restored = true;
            this.config && this._applyConfig(this.config);
        }

        // Implement events, however it is not tested here.
        // get events(): EventsModule {
        //     return jest.fn() as unknown as EventsModule;
        // }
    }

    test("Constructor with style loaded", async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(true),
                once: jest.fn((_, callback) => callback())
            } as unknown as Map,
            _addStyleChangeHandler: jest.fn()
        } as unknown as TomTomMap;

        let testModule = await TestModule.init(tomtomMapMock);
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();
        expect(testModule.sourceAndLayerIDs).toStrictEqual({});

        // Repeating test with config ----------------------:
        const testConfig = { visible: false };
        (tomtomMapMock.mapLibreMap.isStyleLoaded as Mock).mockClear();
        testModule = await TestModule.init(tomtomMapMock, testConfig);
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toStrictEqual(testConfig);
        expect(testModule.getConfig()).toStrictEqual(testConfig);
    });

    test("Constructor with style not loaded yet", async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(false),
                once: jest.fn((_, callback) => callback())
            } as unknown as Map,
            _addStyleChangeHandler: jest.fn()
        } as unknown as TomTomMap;

        let testModule = await TestModule.init(tomtomMapMock);
        let styleDataEventCallback = (tomtomMapMock.mapLibreMap.once as Mock).mock.calls[0][1];
        styleDataEventCallback();

        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(tomtomMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata", styleDataEventCallback);

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();

        // Repeating test with config -----------------------:
        (tomtomMapMock.mapLibreMap.isStyleLoaded as Mock).mockClear();
        (tomtomMapMock.mapLibreMap.once as Mock).mockClear();

        const testConfig = { visible: false };
        testModule = await TestModule.init(tomtomMapMock, testConfig);
        styleDataEventCallback = (tomtomMapMock.mapLibreMap.once as Mock).mock.calls[0][1];
        styleDataEventCallback();

        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(tomtomMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata", styleDataEventCallback);

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toStrictEqual(testConfig);
        expect(testModule.getConfig()).toStrictEqual(testConfig);
    });

    test("Constructor with style not loaded yet and style data timeout", async () => {
        const tomtomMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockReturnValue(false),
                once: jest.fn((_, callback) => callback())
            } as unknown as Map,
            _addStyleChangeHandler: jest.fn()
        } as unknown as TomTomMap;

        const testModule = await TestModule.init(tomtomMapMock);
        await new Promise((resolve) => setTimeout(resolve, 6000));
        const styleDataEventCallback = (tomtomMapMock.mapLibreMap.once as Mock).mock.calls[0][1];
        styleDataEventCallback();
        expect(tomtomMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(tomtomMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata", styleDataEventCallback);

        expect(testModule.initCalled).toBe(true);
        expect(testModule.configApplied).toBeUndefined();
        expect(testModule.getConfig()).toBeUndefined();
    });
});
