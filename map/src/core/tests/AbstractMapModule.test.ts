import { Map } from "maplibre-gl";
import { AbstractMapModule } from "../AbstractMapModule";
import { MapModuleConfig } from "../types/MapModuleConfig";
import { GOSDKMap } from "../../GOSDKMap";
import Mock = jest.Mock;

describe("AbstractMapModule tests", () => {
    class TestModule extends AbstractMapModule<MapModuleConfig> {
        initCalled?: boolean;
        initConfig?: unknown;

        protected init(config?: MapModuleConfig): void {
            this.initCalled = true;
            this.initConfig = config;
        }
    }

    test("Constructor with style loaded", () => {
        const goSDKMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockImplementation(() => true)
            } as unknown as Map
        } as GOSDKMap;

        let testModule = new TestModule(goSDKMapMock);
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(testModule.initCalled).toStrictEqual(true);
        expect(testModule.initConfig).toBeUndefined();

        // Repeating test with config ----------------------:
        const testConfig = { visible: false };
        (goSDKMapMock.mapLibreMap.isStyleLoaded as Mock).mockClear();
        testModule = new TestModule(goSDKMapMock, testConfig);
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(testModule.initCalled).toStrictEqual(true);
        expect(testModule.initConfig).toStrictEqual(testConfig);
    });

    test("Constructor with style not loaded yet", () => {
        const goSDKMapMock = {
            mapLibreMap: {
                isStyleLoaded: jest.fn().mockImplementation(() => false),
                once: jest.fn()
            } as unknown as Map
        } as GOSDKMap;

        let testModule = new TestModule(goSDKMapMock);
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
        testModule = new TestModule(goSDKMapMock, testConfig);
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
                isStyleLoaded: jest.fn().mockImplementation(() => false),
                once: jest.fn().mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 6000)))
            } as unknown as Map
        } as GOSDKMap;

        const testModule = new TestModule(goSDKMapMock);
        await new Promise((resolve) => setTimeout(resolve, 6000));
        const styleDataEventCallback = (goSDKMapMock.mapLibreMap.once as Mock).mock.calls[0][1];
        styleDataEventCallback();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalledTimes(1);
        expect(goSDKMapMock.mapLibreMap.once).toHaveBeenCalledWith("styledata", styleDataEventCallback);

        expect(testModule.initCalled).toStrictEqual(true);
        expect(testModule.initConfig).toBeUndefined();
    });
});
