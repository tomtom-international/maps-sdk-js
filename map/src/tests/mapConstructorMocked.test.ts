import { Map } from "maplibre-gl";
import { TomTomConfig } from "@anw/maps-sdk-js/core";
import { TomTomMap } from "../TomTomMap";

jest.mock("maplibre-gl", () => ({
    Map: jest.fn().mockReturnValue({
        getStyle: jest.fn().mockReturnValue({ layers: [{}] }),
        isStyleLoaded: jest.fn().mockReturnValue(false),
        once: jest.fn(),
        on: jest.fn(),
        getCanvas: jest.fn().mockReturnValue({
            style: {
                cursor: ""
            }
        }),
        getZoom: jest.fn()
    }),
    setRTLTextPlugin: jest.fn().mockResolvedValue(jest.fn()),
    getRTLTextPluginStatus: jest.fn()
}));

describe("Map initialization mocked tests", () => {
    const mockedContainer = jest.fn() as unknown as HTMLElement;

    beforeEach(() => TomTomConfig.instance.reset());

    test("Map init with mostly default parameters", () => {
        TomTomConfig.instance.put({ apiKey: "TEST_KEY" });
        const tomtomMap = new TomTomMap({ container: mockedContainer });
        expect(tomtomMap).toBeDefined();
        expect(Map).toHaveBeenCalledWith({
            container: mockedContainer,
            style: "https://api.tomtom.com/maps/orbis/assets/styles/0.*/style.json?&apiVersion=1&key=TEST_KEY&map=basic_street-light",
            attributionControl: { compact: false },
            validateStyle: false,
            maxTileCacheZoomLevels: 22,
            transformRequest: expect.any(Function)
        });
    });

    test("Map init with some given parameters", () => {
        TomTomConfig.instance.put({ apiKey: "TEST_KEY" });
        const tomtomMap = new TomTomMap(
            { container: mockedContainer, zoom: 3, center: [10, 20] },
            {
                apiKey: "TEST_KEY_2",
                commonBaseURL: "https://api-test.tomtom.com",
                style: {
                    type: "custom",
                    url: "https://custom-style.test.tomtom.com/foo/bar"
                }
            }
        );
        expect(tomtomMap).toBeDefined();
        expect(Map).toHaveBeenCalledWith({
            container: mockedContainer,
            style: "https://custom-style.test.tomtom.com/foo/bar?key=TEST_KEY_2",
            zoom: 3,
            center: [10, 20],
            attributionControl: { compact: false },
            validateStyle: false,
            maxTileCacheZoomLevels: 22,
            transformRequest: expect.any(Function)
        });
    });
});
