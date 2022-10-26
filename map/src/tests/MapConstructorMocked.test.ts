import { Map } from "maplibre-gl";
import { GOSDKConfig } from "@anw/go-sdk-js/core";
import { GOSDKMap } from "../GOSDKMap";

jest.mock("maplibre-gl", () => ({
    Map: jest.fn(),
    setRTLTextPlugin: jest.fn(),
    getRTLTextPluginStatus: jest.fn()
}));

describe("Map initialization mocked tests", () => {
    const mockedContainer = jest.fn() as unknown as HTMLElement;

    beforeEach(() => GOSDKConfig.instance.reset());

    test("Map init with mostly default parameters", () => {
        GOSDKConfig.instance.put({ apiKey: "TEST_KEY" });
        const goSDKMap = new GOSDKMap({ container: mockedContainer });
        expect(goSDKMap).toBeDefined();
        expect(Map).toHaveBeenCalledWith({
            container: mockedContainer,
            style:
                "https://api.tomtom.com/style/1/style/23.1.*/?key=TEST_KEY&map=2/basic_street-light" +
                "&traffic_flow=2/flow_relative-light&traffic_incidents=2/incidents_light&poi=2/poi_dynamic-light" +
                "&hillshade=2-test/hillshade_rgb-light",
            attributionControl: false
        });
    });

    test("Map init with some given parameters", () => {
        GOSDKConfig.instance.put({ apiKey: "TEST_KEY" });
        const goSDKMap = new GOSDKMap(
            { container: mockedContainer, zoom: 3, center: [10, 20] },
            {
                apiKey: "TEST_KEY_2",
                commonBaseURL: "https://api-test.tomtom.com",
                style: {
                    custom: {
                        url: "https://custom-style.test.tomtom.com/foo/bar"
                    }
                }
            }
        );
        expect(goSDKMap).toBeDefined();
        expect(Map).toHaveBeenCalledWith({
            container: mockedContainer,
            style: "https://custom-style.test.tomtom.com/foo/bar?key=TEST_KEY_2",
            zoom: 3,
            center: [10, 20],
            attributionControl: false
        });
    });
});
