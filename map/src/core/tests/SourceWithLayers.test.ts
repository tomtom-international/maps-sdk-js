import { LayerSpecification, Map, Source, VectorSourceSpecification } from "maplibre-gl";
import { GOSDKSource } from "../GOSDKSource";
import {
    AbstractSourceWithLayers,
    AddedSourceWithLayers,
    GeoJSONSourceWithLayers,
    StyleSourceWithLayers
} from "../SourceWithLayers";
import { omit } from "lodash";
import { FeatureCollection } from "geojson";

const testSourceID = "SOURCE_ID";
const layer0 = { id: "layer0", type: "symbol", source: testSourceID } as LayerSpecification;
const layer1 = { id: "layer1", type: "symbol", source: testSourceID } as LayerSpecification;
const testLayerSpecs: LayerSpecification[] = [layer0, layer1];
const testToBeAddedLayerSpecs = [omit(layer0, "source"), omit(layer1, "source")];

describe("AbstractSourceWithLayers tests", () => {
    class TestSourceWithLayers extends AbstractSourceWithLayers {}
    const testGOSDKSource = { id: testSourceID } as GOSDKSource;

    test("Constructor", () => {
        const mapLibreMock = jest.fn() as unknown as Map;
        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.map).toStrictEqual(mapLibreMock);
        expect(sourceWithLayers.source).toStrictEqual(testGOSDKSource);
        expect(sourceWithLayers.layerSpecs).toStrictEqual(testLayerSpecs);
    });

    test("isAnyLayerVisible true", () => {
        const mapLibreMock = {
            getLayoutProperty: jest
                .fn()
                .mockImplementationOnce(() => "visible")
                .mockImplementationOnce(() => "none")
        } as unknown as Map;

        let sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible()).toStrictEqual(true);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility");
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledTimes(1);
        // (First layer was visible, so no more need to query layers)

        // ----------------------
        mapLibreMock.getLayoutProperty = jest
            .fn()
            .mockImplementationOnce(() => "none")
            .mockImplementationOnce(() => undefined); // defaults to visible

        sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible()).toStrictEqual(true);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility");
        // First layer was invisible, so we expect the second one to be queried too:
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility");
    });

    test("isAnyLayerVisible true with filter", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockImplementationOnce(() => "visible")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === layer1.id)).toStrictEqual(true);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility");
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledTimes(1);
    });

    test("isAnyLayerVisible false", () => {
        const mapLibreMock = {
            getLayoutProperty: jest
                .fn()
                .mockImplementationOnce(() => "none")
                .mockImplementationOnce(() => "none")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible()).toStrictEqual(false);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility");
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility");
    });

    test("isAnyLayerVisible false with filter", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockImplementationOnce(() => "none")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === layer1.id)).toStrictEqual(false);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility");
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledTimes(1);
    });

    test("setAllLayersVisible true", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(true);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "visible");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible");
    });

    test("setAllLayersVisible true with filter", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(true, (layer) => layer.id === layer1.id);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
    });

    test("setVisible false", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(false);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "none");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "none");
    });

    test("setVisible false with filter", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(false, (layer) => layer.id === layer1.id);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "none");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
    });
});

describe("StyleSourceWithLayers tests", () => {
    test("constructor", () => {
        const mapLibreMock = {
            getStyle: jest.fn().mockImplementation(() => ({
                sources: { testSourceID: { id: testSourceID } },
                layers: testLayerSpecs
            }))
        } as unknown as Map;
        const source = { id: testSourceID } as Source;
        const sourceWithLayers = new StyleSourceWithLayers(mapLibreMock, source);
        expect(sourceWithLayers.map).toStrictEqual(mapLibreMock);
        expect(sourceWithLayers.source.id).toStrictEqual(testSourceID);
        expect(sourceWithLayers.source.runtimeSource).toStrictEqual(source);
        expect(sourceWithLayers.layerSpecs).toStrictEqual(testLayerSpecs);
    });
});

describe("AddedSourceWithLayers tests", () => {
    test("constructor", () => {
        const mapLibreMock = jest.fn() as unknown as Map;
        const sourceSpec: VectorSourceSpecification = { type: "vector" };
        const sourceWithLayers = new AddedSourceWithLayers(
            mapLibreMock,
            testSourceID,
            sourceSpec,
            testToBeAddedLayerSpecs
        );
        expect(sourceWithLayers.map).toStrictEqual(mapLibreMock);
        expect(sourceWithLayers.source.id).toStrictEqual(testSourceID);
        expect(sourceWithLayers.source.runtimeSource).toBeUndefined();
        expect(sourceWithLayers.source.spec).toStrictEqual(sourceSpec);
    });

    test("ensureAddedToMapWithVisibility", () => {
        const mapLibreMock = {
            getLayer: jest
                .fn()
                .mockImplementationOnce(() => undefined) // layer0 isn't yet there so it will be added
                .mockImplementationOnce(() => layer1),
            getSource: jest.fn().mockImplementation(() => ({ id: testSourceID })),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new AddedSourceWithLayers(
            mapLibreMock,
            testSourceID,
            { type: "vector" },
            testLayerSpecs
        );
        sourceWithLayers.ensureAddedToMapWithVisibility(true);
        expect(mapLibreMock.getSource).toHaveBeenCalledTimes(2);
        expect(mapLibreMock.getLayer).toHaveBeenCalledWith(layer0.id);
        expect(mapLibreMock.getLayer).toHaveBeenCalledWith(layer1.id);
        expect(mapLibreMock.addLayer).toHaveBeenCalledWith({ ...layer0, source: testSourceID }, undefined);
        expect(mapLibreMock.addLayer).toHaveBeenCalledTimes(1);

        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "visible");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible");
    });
});

describe("GeoJSONSourceWithLayers", () => {
    test("Constructor", () => {
        const mapLibreMock = jest.fn() as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        expect(sourceWithLayers.map).toStrictEqual(mapLibreMock);
        expect(sourceWithLayers.source.id).toStrictEqual(testSourceID);
        expect(sourceWithLayers.source.spec).toStrictEqual({
            type: "geojson",
            data: { type: "FeatureCollection", features: [] }
        });
        expect(sourceWithLayers.source.runtimeSource).toBeUndefined();
        expect(sourceWithLayers.layerSpecs).toStrictEqual(testLayerSpecs);
    });

    test("show empty collection", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        const emptyFeatures = {
            type: "FeatureCollection",
            features: []
        } as FeatureCollection;
        sourceWithLayers.show(emptyFeatures);
    });

    test("show filled collection", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        const features = {
            type: "FeatureCollection",
            features: [{}]
        } as FeatureCollection;
        sourceWithLayers.show(features);
    });

    test("clear", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        sourceWithLayers.clear();
    });
});
