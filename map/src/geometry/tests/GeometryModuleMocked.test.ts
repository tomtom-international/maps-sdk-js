import { Geometries } from "@anw/maps-sdk-js/core";
import { DataDrivenPropertyValueSpecification, Map } from "maplibre-gl";
import { GeometryModule } from "../GeometryModule";
import { TomTomMap } from "../../TomTomMap";
import amsterdamGeometryData from "./GeometryModuleMocked.test.data.json";
import { GEOMETRY_SOURCE_ID } from "../../shared";
import { GeoJsonProperties } from "geojson";

// NOTE: these tests are heavily mocked and are mostly used to keep coverage numbers high.
// For real testing of such modules, refer to map-integration-tests.
// Any forced coverage from tests here must be truly covered in map integration tests.
describe("Geometry module tests", () => {
    // eslint-disable-next-line jest/expect-expect
    test("Basic flows", async () => {
        const geometrySource = { id: GEOMETRY_SOURCE_ID, setData: jest.fn() };
        const tomtomMapMock = {
            mapLibreMap: {
                getSource: jest.fn().mockReturnValue(geometrySource),
                getStyle: jest.fn().mockReturnValue({ layers: [{}], sources: { geometrySourceID: {} } }),
                getLayer: jest.fn(),
                addLayer: jest.fn(),
                isStyleLoaded: jest.fn().mockReturnValue(true),
                setLayoutProperty: jest.fn(),
                setPaintProperty: jest.fn()
            } as unknown as Map,
            _eventsProxy: {
                add: jest.fn(),
                ensureAdded: jest.fn()
            },
            _addStyleChangeHandler: jest.fn()
        } as unknown as TomTomMap;

        const geometryConfig = {
            colorConfig: { fillColor: "warm" },
            textConfig: { textField: "title" }
        };

        const textField: DataDrivenPropertyValueSpecification<string> = ["get", "country"];

        const testGeometryData = amsterdamGeometryData as Geometries<GeoJsonProperties>;
        let geometry = await GeometryModule.init(tomtomMapMock, geometryConfig);
        // to be able to spy on private methods
        const geometryAny: any = geometry;
        jest.spyOn(geometryAny, "applyConfig");
        jest.spyOn(geometryAny, "applyTextConfig");
        jest.spyOn(geometryAny, "updateLayerAndData");
        expect(geometry.getConfig()).toMatchObject(geometryConfig);
        geometry.applyTextConfig({ textField });
        expect(geometryAny.applyTextConfig).toHaveBeenCalledWith({ textField });
        expect(geometryAny.updateLayerAndData).toHaveBeenCalledTimes(1);
        expect(geometry.getConfig()).toEqual({ ...geometryConfig, textConfig: { textField } });

        geometry.show(testGeometryData);
        geometry.clear();
        geometry = await GeometryModule.init(tomtomMapMock);
        geometry.show(testGeometryData);
        geometry.clear();
        expect(geometry.events).toBeDefined();
    });
});
