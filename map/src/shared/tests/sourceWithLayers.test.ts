import type { LayerSpecification, Map, Source, VectorSourceSpecification } from "maplibre-gl";
import type { TomTomMapSource } from "../TomTomMapSource";
import {
    AbstractSourceWithLayers,
    AddedSourceWithLayers,
    GeoJSONSourceWithLayers,
    StyleSourceWithLayers
} from "../SourceWithLayers";
import omit from "lodash/omit";
import type { FeatureCollection } from "geojson";

const testSourceID = "SOURCE_ID";
const layer0 = { id: "layer0", type: "symbol", source: testSourceID } as LayerSpecification;
const layer1 = { id: "layer1", type: "symbol", source: testSourceID } as LayerSpecification;
const testLayerSpecs: LayerSpecification[] = [layer0, layer1];
const testToBeAddedLayerSpecs = [omit(layer0, "source"), omit(layer1, "source")];

describe("AbstractSourceWithLayers tests", () => {
    class TestSourceWithLayers extends AbstractSourceWithLayers {}
    const testTomTomMapSource = { id: testSourceID } as TomTomMapSource;

    test("Constructor", () => {
        const mapLibreMock = jest.fn() as unknown as Map;
        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs);
        expect(sourceWithLayers.map).toEqual(mapLibreMock);
        expect(sourceWithLayers.source).toEqual(testTomTomMapSource);
        expect(sourceWithLayers._layerSpecs).toEqual(testLayerSpecs);
    });

    test("isAnyLayerVisible true", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("visible").mockReturnValueOnce("none")
        } as unknown as Map;
        expect(new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs).isAnyLayerVisible()).toBe(
            true
        );

        // ----------------------
        mapLibreMock.getLayoutProperty = jest.fn().mockReturnValueOnce("none").mockReturnValueOnce(undefined); // undefined defaults to visible
        expect(new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs).isAnyLayerVisible()).toBe(
            true
        );
    });

    test("isAnyLayerVisible with filter", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("visible")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === layer1.id)).toBe(true);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === "not-there")).toBe(false);
    });

    test("isAnyLayerVisible false", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("none").mockReturnValueOnce("none")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible()).toEqual(false);
    });

    test("isAnyLayerVisible false with filter", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("none")
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === layer1.id)).toBe(false);
    });

    test("areAllLayersVisible true", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("visible").mockReturnValueOnce("visible")
        } as unknown as Map;
        expect(new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs).areAllLayersVisible()).toBe(
            true
        );

        // ----------------------
        mapLibreMock.getLayoutProperty = jest.fn().mockReturnValueOnce("visible").mockReturnValueOnce(undefined); // undefined defaults to visible
        expect(new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs).areAllLayersVisible()).toBe(
            true
        );
    });

    test("areAllLayersVisible false", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockReturnValueOnce("none").mockReturnValueOnce("none")
        } as unknown as Map;
        expect(new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs).areAllLayersVisible()).toBe(
            false
        );

        // ----------------------
        mapLibreMock.getLayoutProperty = jest.fn().mockReturnValueOnce("none").mockReturnValueOnce(undefined); // undefined defaults to visible
        expect(new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs).areAllLayersVisible()).toBe(
            false
        );
    });

    test("areAllLayersVisible with filter", () => {
        const mapLibreMock = {
            // layer0 visible, layer1 hidden:
            getLayoutProperty: jest.fn().mockReturnValueOnce(undefined).mockReturnValueOnce("none")
        } as unknown as Map;
        expect(
            new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs).areAllLayersVisible(
                (layer) => layer.id === layer0.id
            )
        ).toBe(true);

        expect(
            new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs).areAllLayersVisible(
                (layer) => layer.id === layer1.id
            )
        ).toBe(false);
    });

    test("setAllLayersVisible true", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs);
        sourceWithLayers.setLayersVisible(true);
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

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs);
        sourceWithLayers.setLayersVisible(true, (layer) => layer.id === layer1.id);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible", {
            validate: false
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
    });

    test("setVisible false", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs);
        sourceWithLayers.setLayersVisible(false);
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

        const sourceWithLayers = new TestSourceWithLayers(mapLibreMock, testTomTomMapSource, testLayerSpecs);
        sourceWithLayers.setLayersVisible(false, (layer) => layer.id === layer1.id);
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
        expect(sourceWithLayers.map).toEqual(mapLibreMock);
        expect(sourceWithLayers.source.id).toEqual(testSourceID);
        expect(sourceWithLayers.source.runtimeSource).toEqual(source);
        expect(sourceWithLayers._layerSpecs).toEqual(testLayerSpecs);
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
        expect(sourceWithLayers.map).toEqual(mapLibreMock);
        expect(sourceWithLayers.source.id).toEqual(testSourceID);
        expect(sourceWithLayers.source.runtimeSource).toBeUndefined();
        expect(sourceWithLayers.source.spec).toEqual(sourceSpec);
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
        sourceWithLayers.ensureAddedToMapWithVisibility(true, true);
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

    test("equalSourceAndLayerIDs", () => {
        const mapLibreMock = {
            getLayer: jest.fn(),
            getSource: jest.fn().mockReturnValue({ id: testSourceID }),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn(),
            getStyle: jest.fn().mockReturnValue({
                sources: { testSourceID: { id: testSourceID } },
                layers: testLayerSpecs
            })
        } as unknown as Map;

        const sourceWithLayersA = new AddedSourceWithLayers(
            mapLibreMock,
            testSourceID,
            { type: "vector" },
            testLayerSpecs
        );

        expect(sourceWithLayersA.equalSourceAndLayerIDs(sourceWithLayersA)).toBe(true);

        const sourceWithLayersB = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        expect(sourceWithLayersA.equalSourceAndLayerIDs(sourceWithLayersB)).toBe(true);
        expect(sourceWithLayersB.equalSourceAndLayerIDs(sourceWithLayersA)).toBe(true);

        const anotherSource = new GeoJSONSourceWithLayers(mapLibreMock, "another-source", testToBeAddedLayerSpecs);
        expect(sourceWithLayersB.equalSourceAndLayerIDs(anotherSource)).toBe(false);

        const onlyOneLayer = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, [layer0]);
        expect(sourceWithLayersB.equalSourceAndLayerIDs(onlyOneLayer)).toBe(false);
        expect(anotherSource.equalSourceAndLayerIDs(onlyOneLayer)).toBe(false);

        const styleSourceWithLayers = new StyleSourceWithLayers(mapLibreMock, { id: testSourceID } as Source);
        expect(sourceWithLayersA.equalSourceAndLayerIDs(styleSourceWithLayers)).toBe(true);
        expect(styleSourceWithLayers.equalSourceAndLayerIDs(sourceWithLayersA)).toBe(true);
        expect(styleSourceWithLayers.equalSourceAndLayerIDs(sourceWithLayersB)).toBe(true);
        expect(styleSourceWithLayers.equalSourceAndLayerIDs(anotherSource)).toBe(false);
        expect(anotherSource.equalSourceAndLayerIDs(styleSourceWithLayers)).toBe(false);
        expect(styleSourceWithLayers.equalSourceAndLayerIDs(onlyOneLayer)).toBe(false);
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
        expect(sourceWithLayers.map).toEqual(mapLibreMock);
        expect(sourceWithLayers.source.id).toEqual(testSourceID);
        expect(sourceWithLayers.source.spec).toEqual({
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
            promoteId: "id"
        });
        expect(sourceWithLayers.source.runtimeSource).toEqual({ id: testSourceID });
        expect(sourceWithLayers._layerSpecs).toEqual(testLayerSpecs);
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

    test("putEventState", () => {
        const features = {
            features: [{ properties: {} }, { properties: { eventState: "click" } }, { properties: {} }]
        } as FeatureCollection;

        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue({ id: testSourceID, setData: jest.fn() }),
            getLayer: jest.fn(),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        sourceWithLayers.show(features);
        expect(sourceWithLayers.shownFeatures).toEqual(features);

        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(4);
        sourceWithLayers.putEventState({ index: 0, state: "hover", mode: "add", show: false });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [
                { properties: { eventState: "hover" } },
                { properties: { eventState: "click" } },
                { properties: {} }
            ]
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(4);

        sourceWithLayers.putEventState({ index: 0, state: "click", mode: "add" });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [
                { properties: { eventState: "click" } },
                { properties: { eventState: "click" } },
                { properties: {} }
            ]
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(6);

        sourceWithLayers.putEventState({ index: 2, state: "click", mode: "put" });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [{ properties: {} }, { properties: {} }, { properties: { eventState: "click" } }]
        });

        sourceWithLayers.putEventState({ index: 0, state: "hover", mode: "put" });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [
                { properties: { eventState: "hover" } },
                { properties: {} },
                { properties: { eventState: "click" } }
            ]
        });

        // TODO: this scenario might be something to improve (should we remove the "hover" event state automatically?)
        sourceWithLayers.putEventState({ index: 1, state: "click", mode: "put" });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [
                { properties: { eventState: "hover" } },
                { properties: { eventState: "click" } },
                { properties: {} }
            ]
        });
    });

    test("cleanEventState", () => {
        const features = {
            features: [
                { properties: {} },
                { properties: { eventState: "hover" } },
                { properties: { eventState: "click" } }
            ]
        } as FeatureCollection;

        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue({ id: testSourceID, setData: jest.fn() }),
            getLayer: jest.fn(),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        sourceWithLayers.show(features);
        expect(sourceWithLayers.shownFeatures).toEqual(features);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(4);

        sourceWithLayers.cleanEventState({ index: 1 });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [{ properties: {} }, { properties: {} }, { properties: { eventState: "click" } }]
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(6);

        sourceWithLayers.cleanEventState({ index: 0, show: false });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [{ properties: {} }, { properties: {} }, { properties: { eventState: "click" } }]
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(6);

        sourceWithLayers.cleanEventState({ index: 2 });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [{ properties: {} }, { properties: {} }, { properties: {} }]
        });
    });

    test("cleanEventStates", () => {
        const features = {
            features: [
                { properties: { eventState: "long-hover" } },
                { properties: { eventState: "hover" } },
                { properties: { eventState: "click" } }
            ]
        } as unknown as FeatureCollection;

        const mapLibreMock = {
            getSource: jest.fn().mockReturnValue({ id: testSourceID, setData: jest.fn() }),
            getLayer: jest.fn(),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;
        const sourceWithLayers = new GeoJSONSourceWithLayers(mapLibreMock, testSourceID, testToBeAddedLayerSpecs);
        sourceWithLayers.show(features);
        expect(sourceWithLayers.shownFeatures).toEqual(features);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(4);

        sourceWithLayers.cleanEventStates({ states: ["long-hover"], show: false });
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [
                { properties: {} },
                { properties: { eventState: "hover" } },
                { properties: { eventState: "click" } }
            ]
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(4);

        sourceWithLayers.cleanEventStates();
        expect(sourceWithLayers.shownFeatures).toEqual({
            features: [{ properties: {} }, { properties: {} }, { properties: {} }]
        });
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(6);
    });
});
