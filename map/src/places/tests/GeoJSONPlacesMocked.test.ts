import { Place, Places } from "@anw/maps-sdk-js/core";
import { GeoJSONSource, Map } from "maplibre-gl";
import { GeoJSONPlaces } from "../GeoJSONPlaces";
import { TomTomMap } from "../../TomTomMap";
import { EventsModule, PLACES_SOURCE_PREFIX_ID } from "../../shared";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("GeoJSON Places module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", async () => {
        const placesSource: Partial<GeoJSONSource> = { id: PLACES_SOURCE_PREFIX_ID, setData: jest.fn() };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValue(placesSource),
                getLayer: jest.fn(),
                getStyle: jest.fn().mockReturnValue({ layers: [] }),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockReturnValue(true),
                setLayoutProperty: jest.fn(),
                setPaintProperty: jest.fn(),
                setFilter: jest.fn()
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            },
            _addStyleChangeHandler: jest.fn()
        } as unknown as TomTomMap;

        const testPlaces = {
            type: "FeatureCollection",
            features: [{ properties: { address: { freeformAddress: "TEST_ADDRESS" } } }]
        } as Places;
        const places = await GeoJSONPlaces.init(tomtomMapMock, {
            iconConfig: {
                iconStyle: "circle"
            },
            textConfig: {
                textColor: "green"
            },
            extraFeatureProps: { prop1: (place: Place) => `Address: ${place.properties.address}` }
        });
        places.show(testPlaces);
        // to be able to spy on private methods
        const placesAny: any = places;
        jest.spyOn(placesAny, "updateLayersAndData");
        jest.spyOn(placesAny, "updateData");
        jest.spyOn(tomtomMapMock.mapLibreMap, "getStyle");
        places.applyConfig({ iconConfig: { iconStyle: "poi-like" } });
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalledTimes(1);
        expect(placesAny.updateData).toHaveBeenCalledTimes(1);
        expect(placesAny.updateLayersAndData).toHaveBeenCalledTimes(1);

        places.setExtraFeatureProps({ prop: "static" });
        expect(placesAny.updateData).toHaveBeenCalledTimes(2);

        places.applyTextConfig({ textFont: ["Noto-Medium"], textSize: 16 });
        expect(placesAny.updateLayersAndData).toHaveBeenCalledTimes(2);
        expect(placesAny.updateData).toHaveBeenCalledTimes(3);

        places.applyIconConfig({ iconStyle: "poi-like" });
        expect(placesAny.updateLayersAndData).toHaveBeenCalledTimes(3);
        expect(placesAny.updateData).toHaveBeenCalledTimes(4);

        places.clear();
        expect(places.events).toBeInstanceOf(EventsModule);
    });
});
