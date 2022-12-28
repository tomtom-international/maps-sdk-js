import { Places } from "@anw/go-sdk-js/core";
import { GeoJSONSource, Map } from "maplibre-gl";
import { GeoJSONPlaces } from "../GeoJSONPlaces";
import { GOSDKMap } from "../../GOSDKMap";
import { PLACES_SOURCE_ID } from "../../core/layers/sourcesIDs";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("GeoJSON Places module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", () => {
        const placesSource: Partial<GeoJSONSource> = { id: PLACES_SOURCE_ID, setData: jest.fn() };
        const goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValue(placesSource),
                getLayer: jest.fn(),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockReturnValue(true),
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
