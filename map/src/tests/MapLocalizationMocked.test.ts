import { GOSDKConfig } from "@anw/go-sdk-js/core";
import { GOSDKMap } from "../GOSDKMap";

jest.mock("maplibre-gl", () => ({
    Map: jest.fn().mockReturnValue({
        getStyle: jest.fn().mockReturnValue({ layers: [{}] }),
        isStyleLoaded: jest.fn().mockReturnValue(true),
        getCanvas: jest.fn().mockReturnValue({
            style: {
                cursor: ""
            }
        }),
        once: jest.fn(),
        on: jest.fn(),
        getZoom: jest.fn()
    }),
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
        jest.spyOn(GOSDKMap.prototype, "setLanguage");
        const goSDKMap = new GOSDKMap(
            { container: mockedContainer },
            {
                language: "en_GB"
            }
        );
        expect(goSDKMap.mapLibreMap.getStyle).toHaveBeenCalledTimes(1);
        expect(goSDKMap.setLanguage).toHaveBeenCalledTimes(1);
        expect(goSDKMap.setLanguage).toHaveBeenCalledWith("en_GB");
    });

    test("Localize map after initialization", () => {
        const goSDKMap = new GOSDKMap({ container: mockedContainer });
        jest.spyOn(goSDKMap, "setLanguage");
        goSDKMap.setLanguage("ar");
        expect(goSDKMap.setLanguage).toHaveBeenCalledTimes(1);
        expect(goSDKMap.setLanguage).toHaveBeenCalledWith("ar");
    });
});
