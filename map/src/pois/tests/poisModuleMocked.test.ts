import { Map } from "maplibre-gl";
import { TomTomMap } from "../../TomTomMap";
import { POIsModule } from "../POIsModule";
import { POI_SOURCE_ID } from "../../shared";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Vector tiles POI module tests", () => {
    let tomtomMapMock: TomTomMap;

    beforeEach(() => {
        const poiSource = { id: POI_SOURCE_ID };
        tomtomMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValueOnce(poiSource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { poiSourceID: {} } }),
                setFilter: jest.fn(),
                getFilter: jest.fn(),
                once: jest.fn().mockReturnValue(Promise.resolve())
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            },
            addStyleChangeHandler: jest.fn(),
            mapReady: jest.fn().mockReturnValue(false).mockReturnValue(true)
        } as unknown as TomTomMap;
    });

    test("Initializing module with config", async () => {
        const pois = await POIsModule.get(tomtomMapMock, {
            visible: false
        });
        expect(pois).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();

        // (see note on top of test file)
        pois.setVisible(false);
        pois.isVisible();
    });

    test("Initializing module with no config", async () => {
        const pois = await POIsModule.get(tomtomMapMock);
        expect(pois).toBeDefined();
        expect(tomtomMapMock.mapLibreMap.getSource).toHaveBeenCalled();
        expect(tomtomMapMock.mapLibreMap.getStyle).toHaveBeenCalled();
    });

    test("filter methods while initializing module with filter config", async () => {
        const pois = await POIsModule.get(tomtomMapMock, {
            filters: {
                categories: {
                    show: "all_except",
                    values: ["FOOD_DRINKS_GROUP", "ENTERTAINMENT"]
                }
            }
        });

        jest.spyOn(pois, "filterCategories");
        expect(pois).toBeDefined();
        pois.filterCategories({
            show: "all_except",
            values: ["ACCOMMODATION_GROUP"]
        });
        expect(pois.filterCategories).toHaveBeenCalledTimes(1);
        expect(pois.filterCategories).toHaveBeenCalledWith({
            show: "all_except",
            values: ["ACCOMMODATION_GROUP"]
        });
    });
});
