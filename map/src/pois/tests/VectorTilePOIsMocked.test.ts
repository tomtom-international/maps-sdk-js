import { Map } from "maplibre-gl";
import { GOSDKMap } from "../../GOSDKMap";
import { VectorTilePOIs } from "../VectorTilePOIs";
import { POI_SOURCE_ID } from "../../core";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Vector tiles POI module tests", () => {
    let goSDKMapMock: GOSDKMap;

    beforeEach(() => {
        const poiSource = { id: POI_SOURCE_ID };
        goSDKMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(poiSource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { poiSourceID: {} } }),
                isStyleLoaded: jest.fn().mockReturnValue(true),
                setFilter: jest.fn(),
                getFilter: jest.fn()
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn()
            }
        } as unknown as GOSDKMap;
    });

    test("Initializing module with config", async () => {
        const pois = await VectorTilePOIs.init(goSDKMapMock, {
            visible: false
        });
        expect(pois).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        pois.toggleVisibility();
        pois.setVisible(false);
        pois.isVisible();
    });

    test("Initializing module with no config", async () => {
        const pois = await VectorTilePOIs.init(goSDKMapMock);
        expect(pois).toBeDefined();
        expect(goSDKMapMock.mapLibreMap.isStyleLoaded).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(goSDKMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });

    test("filter methods while initializing module with filter config", async () => {
        const pois = await VectorTilePOIs.init(goSDKMapMock, {
            filters: {
                categories: {
                    show: "all_except",
                    values: ["FOOD_DRINKS_GROUP", "ENTERTAINMENT"]
                }
            }
        });

        jest.spyOn(pois, "setCategoriesFilterAndApply");
        expect(pois).toBeDefined();
        pois.setCategoriesFilterAndApply({
            show: "all_except",
            values: ["ACCOMMODATION_GROUP"]
        });
        expect(pois.setCategoriesFilterAndApply).toHaveBeenCalledTimes(1);
        expect(pois.setCategoriesFilterAndApply).toHaveBeenCalledWith({
            show: "all_except",
            values: ["ACCOMMODATION_GROUP"]
        });
    });
});
