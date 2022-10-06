import { Map } from "maplibre-gl";
import { GOSDKMap } from "../GOSDKMap";

jest.mock("maplibre-gl", () => ({
    Map: jest.fn()
}));

describe("Map initialization mocked tests", () => {
    const mockedContainer = jest.fn() as unknown as HTMLElement;

    test("Map init with mostly default parameters", () => {
        const goSDKMap = new GOSDKMap({ container: mockedContainer }, { apiKey: "TEST_KEY" });
        expect(goSDKMap).toBeDefined();
        expect(Map).toHaveBeenCalledWith({
            container: mockedContainer,
            style:
                "https://api.tomtom.com/style/1/style/22.3.*/?key=TEST_KEY&map=2/basic_street-light" +
                "&traffic_flow=2/flow_relative-light&traffic_incidents=2/incidents_light&poi=2/poi_dynamic-light",
            attributionControl: false
        });
    });

    test("Map init with some given parameters", () => {
        const goSDKMap = new GOSDKMap(
            { container: mockedContainer, zoom: 3, center: [10, 20] },
            {
                apiKey: "TEST_KEY",
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
            style: "https://custom-style.test.tomtom.com/foo/bar?key=TEST_KEY",
            zoom: 3,
            center: [10, 20],
            attributionControl: false
        });
    });
});
