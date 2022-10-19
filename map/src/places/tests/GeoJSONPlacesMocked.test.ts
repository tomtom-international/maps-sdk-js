import { Places } from "@anw/go-sdk-js/core";
import { Map } from "maplibre-gl";

import { GeoJSONPlaces, placesSourceID } from "../GeoJSONPlaces";
import { GOSDKMap } from "../../GOSDKMap";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("GeoJSON Places module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", () => {
        const placesSource = { id: placesSourceID };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockImplementationOnce(() => placesSource),
                getStyle: jest.fn().mockImplementation(() => ({ layers: [{}], sources: { placesSourceID: {} } })),
                getLayer: jest.fn(),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockImplementation(() => true),
                setLayoutProperty: jest.fn()
            } as unknown as Map
        } as GOSDKMap;
        const testPlaces = {
            type: "FeatureCollection",
            features: [{ properties: { address: { freeformAddress: "TEST_ADDRESS" } } }]
        } as Places;
        const places = new GeoJSONPlaces(goSDKMapMock);
        places.show(testPlaces);
        places.clear();
    });
});
