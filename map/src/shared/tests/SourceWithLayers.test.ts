import { LayerSpecification, Map, Source, VectorSourceSpecification } from "maplibre-gl";
import { GOSDKSource } from "../GOSDKSource";
import {
    AbstractSourceWithLayers,
    AddedSourceWithLayers,
    GeoJSONSourceWithLayers,
    StyleSourceWithLayers
} from "../SourceWithLayers";
import omit from "lodash/omit";
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
            getLayoutProperty: jest.fn().mockReturnValueOnce("visible").mockReturnValueOnce("none")
        } as unknown as Map;
        expect(new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs).isAnyLayerVisible()).toBe(true);

        // ----------------------
        mapLibreMock.getLayoutProperty = jest.fn().mockReturnValueOnce("none").mockReturnValueOnce(undefined); // undefined defaults to visible
        expect(new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs).isAnyLayerVisible()).toBe(true);
    });

    test("isAnyLayerVisible with filter", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("visible")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === layer1.id)).toBe(true);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === "not-there")).toBe(false);
    });

    test("isAnyLayerVisible false", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("none").mockReturnValueOnce("none")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible()).toStrictEqual(false);
    });

    test("isAnyLayerVisible false with filter", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("none")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === layer1.id)).toBe(false);
    });

    test("areAllLayersVisible true", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("visible").mockReturnValueOnce("visible")
        } as unknown as Map;
        expect(new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs).areAllLayersVisible()).toBe(
            true
        );

        // ----------------------
        mapLibreMock.getLayoutProperty = jest.fn().mockReturnValueOnce("visible").mockReturnValueOnce(undefined); // undefined defaults to visible
        expect(new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs).areAllLayersVisible()).toBe(
            true
        );
    });

    test("areAllLayersVisible false", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("none").mockReturnValueOnce("none")
        } as unknown as Map;
        expect(new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs).areAllLayersVisible()).toBe(
            false
        );

        // ----------------------
        mapLibreMock.getLayoutProperty = jest.fn().mockReturnValueOnce("none").mockReturnValueOnce(undefined); // undefined defaults to visible
        expect(new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs).areAllLayersVisible()).toBe(
            false
        );
    });

    test("areAllLayersVisible with filter", () => {
        const mapLibreMock = {
            // layer0 visible, layer1 hidden:
            getLayoutProperty: jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce("none")
        } as unknown as Map;
        expect(
            new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs).areAllLayersVisible(
                (layer) => layer.id === layer0.id
            )
        ).toBe(true);

        expect(
            new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs).areAllLayersVisible(
                (layer) => layer.id === layer1.id
            )
        ).toBe(false);
    });

    test("setAllLayersVisible true", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(true);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "visible", {
            validate: false
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible", {
            validate: false
        });
    });

    test("setAllLayersVisible true with filter", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(true, (layer) => layer.id === layer1.id);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible", {
            validate: false
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
    });

    test("setVisible false", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(false);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "none", {
            validate: false
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "none", {
            validate: false
        });
    });

    test("setVisible false with filter", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(false, (layer) => layer.id === layer1.id);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "none", {
            validate: false
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
    });
});

describe("StyleSourceWithLayers tests", () => {
    test("constructor", () => {
        const mapLibreMock = {
            getStyle: jest.fn().mockReturnValue({
                sources: { testSourceID: { id: testSourceID } },
                layers: testLayerSpecs
            })
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
                .mockReturnValueOnce(undefined) // layer0 isn't yet there so it will be added
                .mockReturnValueOnce(layer1),
            getSource: jest.fn().mockReturnValue({ id: testSourceID }),
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

        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "visible", {
            validate: false
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible", {
            validate: false
        });
    });
});

describe("GeoJSONSourceWithLayers", () => {
    test("Constructor", () => {
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue({ id: testSourceID }),
            getLayer: jest.fn(),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        expect(sourceWithLayers.map).toStrictEqual(mapLibreMock);
        expect(sourceWithLayers.source.id).toStrictEqual(testSourceID);
        expect(sourceWithLayers.source.spec).toStrictEqual({
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
            promoteId: "id"
        });
        expect(sourceWithLayers.source.runtimeSource).toStrictEqual({ id: testSourceID });
        expect(sourceWithLayers.layerSpecs).toStrictEqual(testLayerSpecs);
    });

    // eslint-disable-next-line jest/expect-expect
    test("show empty collection", () => {
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue({ id: testSourceID, setData: jest.fn() }),
            getLayer: jest.fn(),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        const emptyFeatures = {
            type: "FeatureCollection",
            features: []
        } as FeatureCollection;
        sourceWithLayers.show(emptyFeatures);
    });

    // eslint-disable-next-line jest/expect-expect
    test("show filled collection", () => {
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue({ id: testSourceID, setData: jest.fn() }),
            getLayer: jest.fn(),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        const features = {
            type: "FeatureCollection",
            features: [{}]
        } as FeatureCollection;
        sourceWithLayers.show(features);
    });

    // eslint-disable-next-line jest/expect-expect
    test("clear", () => {
        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue({ id: testSourceID, setData: jest.fn() }),
            getLayer: jest.fn(),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        sourceWithLayers.clear();
    });
});
