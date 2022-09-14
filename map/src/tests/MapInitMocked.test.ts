import { Map as MapRenderer } from "@nav/web-renderer";
import { Map } from "../Map";

jest.mock("@nav/web-renderer", () => ({
    Map: jest.fn()
}));

describe("Map initialization mocked tests", () => {
    const mockedContainer = jest.fn() as unknown as HTMLElement;

    test("Map init with mostly default parameters", () => {
        const map = new Map({ htmlContainer: mockedContainer, apiKey: "TEST_KEY" });
        expect(map).toBeDefined();
        expect(MapRenderer).toHaveBeenCalledWith({
            container: mockedContainer,
            key: "TEST_KEY",
            style:
                "https://api.tomtom.com/style/1/style/22.3.*/?key=TEST_KEY&map=2/basic_street-light" +
                "&traffic_flow=2/flow_relative-light&traffic_incidents=2/incidents_light&poi=2/poi_dynamic-light"
        });
    });

    test("Map init with some given parameters", () => {
        const map = new Map({
            htmlContainer: mockedContainer,
            apiKey: "TEST_KEY",
            commonBaseURL: "https://api-test.tomtom.com",
            style: {
                custom: {
                    url: "https://custom-style.test.tomtom.com/foo/bar"
                }
            },
            zoom: 3,
            center: [10, 20]
        });
        expect(map).toBeDefined();
        expect(MapRenderer).toHaveBeenCalledWith({
            container: mockedContainer,
            key: "TEST_KEY",
            style: "https://custom-style.test.tomtom.com/foo/bar?key=TEST_KEY",
            zoom: 3,
            latitude: 20,
            longitude: 10
        });
    });
});
