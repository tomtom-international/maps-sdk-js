import { TomTomConfig } from "@anw/go-sdk-js/core";
import { TomTomMap } from "../TomTomMap";

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
    TomTomConfig.instance.put({ apiKey: "TEST_KEY" });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("Map init with given language in sdk config", () => {
        jest.spyOn(TomTomMap.prototype, "setLanguage");
        const tomtomMap = new TomTomMap(
            { container: mockedContainer },
            {
                language: "en-GB"
            }
        );
        expect(tomtomMap.mapLibreMap.getStyle).toHaveBeenCalledTimes(1);
        expect(tomtomMap.setLanguage).toHaveBeenCalledTimes(1);
        expect(tomtomMap.setLanguage).toHaveBeenCalledWith("en-GB");
    });

    test("Localize map after initialization", () => {
        const tomtomMap = new TomTomMap({ container: mockedContainer });
        jest.spyOn(tomtomMap, "setLanguage");
        tomtomMap.setLanguage("ar");
        expect(tomtomMap.setLanguage).toHaveBeenCalledTimes(1);
        expect(tomtomMap.setLanguage).toHaveBeenCalledWith("ar");
    });
});
