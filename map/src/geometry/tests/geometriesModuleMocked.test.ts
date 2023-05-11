import { Geometries } from "@anw/maps-sdk-js/core";
import { DataDrivenPropertyValueSpecification, Map } from "maplibre-gl";
import { GeometriesModule } from "../GeometriesModule";
import { TomTomMap } from "../../TomTomMap";
import amsterdamGeometryData from "./geometriesModuleMocked.test.data.json";
import { mapStyleLayerIDs } from "../../shared";
import { GeoJsonProperties } from "geojson";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Geometry module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", async () => {
        const geometrySource = { id: "sourceID", setData: jest.fn() };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValue(geometrySource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { geometrySourceID: {} } }),
                getLayer: jest.fn(),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockReturnValue(true),
                setLayoutProperty: jest.fn(),
                setPaintProperty: jest.fn(),
                setFilter: jest.fn(),
                moveLayer: jest.fn()
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            },
            addStyleChangeHandler: jest.fn()
        } as unknown as TomTomMap;

        const geometryConfig = { colorConfig: { fillColor: "warm" }, textConfig: { textField: "title" } };

        const textField: DataDrivenPropertyValueSpecification<string> = ["get", "country"];

        const testGeometryData = amsterdamGeometryData as Geometries<GeoJsonProperties>;
        let geometry = await GeometriesModule.init(tomtomMapMock, geometryConfig);
        // to be able to spy on private methods
        const geometryAny: any = geometry;
        jest.spyOn(geometryAny, "applyConfig");
        jest.spyOn(geometryAny, "applyTextConfig");
        jest.spyOn(geometryAny, "updateLayerAndData");
        jest.spyOn(geometryAny, "moveBeforeLayerID");
        expect(geometry.getConfig()).toMatchObject(geometryConfig);
        geometry.applyTextConfig({ textField });
        expect(geometryAny.applyTextConfig).toHaveBeenCalledWith({ textField });
        expect(geometryAny.updateLayerAndData).toHaveBeenCalledTimes(1);
        expect(geometry.getConfig()).toEqual({ ...geometryConfig, textConfig: { textField } });

        geometry.moveBeforeLayer("top");
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith("geometry-0_Title");
        geometry.moveBeforeLayer("country");
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.country);
        geometry.moveBeforeLayer("lowestPlaceLabel");
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.lowestPlaceLabel);
        geometry.moveBeforeLayer("poi");
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.poi);
        geometry.moveBeforeLayer("lowestLabel");
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.lowestLabel);
        geometry.moveBeforeLayer("lowestRoadLine");
        expect(geometryAny.moveBeforeLayerID).toHaveBeenCalledWith(mapStyleLayerIDs.lowestRoadLine);

        geometry.show(testGeometryData);
        geometry.clear();
        geometry = await GeometriesModule.init(tomtomMapMock);
        geometry.show(testGeometryData);
        geometry.clear();
        expect(geometry.events).toBeDefined();
    });
});
