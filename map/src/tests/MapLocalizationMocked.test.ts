import { GOSDKConfig } from "@anw/go-sdk-js/core";
import { GOSDKMap } from "../GOSDKMap";

jest.mock("maplibre-gl", () => ({
    Map: jest.fn().mockImplementation(() => ({
        getStyle: jest.fn().mockImplementation(() => ({ layers: [{}] })),
        isStyleLoaded: jest.fn().mockImplementation(() => true),
        once: jest.fn()
    })),
    setRTLTextPlugin: jest.fn(),
    getRTLTextPluginStatus: jest.fn()
}));

describe("Map localization mocked tests", () => {
    const mockedContainer = jest.fn() as unknown as HTMLElement;
    GOSDKConfig.instance.put({ apiKey: "TEST_KEY" });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Map init with given language in sdk config", () => {
        jest.spyOn(GOSDKMap.prototype, "localizeMap");
        const goSDKMap = new GOSDKMap(
            { container: mockedContainer },
            {
                language: "en_GB"
            }
        );
        expect(goSDKMap.mapLibreMap.getStyle).toHaveBeenCalledTimes(1);
        expect(goSDKMap.localizeMap).toHaveBeenCalledTimes(1);
        expect(goSDKMap.localizeMap).toHaveBeenCalledWith("en_GB");
    });

    test("Localize map after initialization", () => {
        const goSDKMap = new GOSDKMap({ container: mockedContainer });
        jest.spyOn(goSDKMap, "localizeMap");
        goSDKMap.localizeMap("ar");
        expect(goSDKMap.localizeMap).toHaveBeenCalledTimes(1);
        expect(goSDKMap.localizeMap).toHaveBeenCalledWith("ar");
    });
});
