import { LayerSpecification, Map } from "maplibre-gl";
import { SourceWithLayers } from "../SourceWithLayers";
import { GOSDKSource } from "../GOSDKSource";

describe("SourceWithLayers tests", () => {
    const testSourceID = "SOURCE_ID";
    const testGOSDKSource = { id: testSourceID } as GOSDKSource;
    const layer0 = { id: "layer0", foo: "bar" };
    const layer1 = { id: "layer1", something: "value" };
    const testLayerSpecs = [layer0, layer1] as unknown as LayerSpecification[];

    test("Constructor", () => {
        const mapLibreMock = jest.fn() as unknown as Map;
        const sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.map).toStrictEqual(mapLibreMock);
        expect(sourceWithLayers.source).toStrictEqual(testGOSDKSource);
        expect(sourceWithLayers.layerSpecs).toStrictEqual([
            { ...testLayerSpecs[0], source: testSourceID },
            { ...testLayerSpecs[1], source: testSourceID }
        ]);
    });

    test("ensureAddedToMapWithVisibility", () => {
        const goSDKSourceMock = {
            id: testSourceID,
            ensureAddedToMap: jest.fn()
        } as unknown as GOSDKSource;

        const mapLibreMock = {
            getLayer: jest
                .fn()
                .mockImplementationOnce(() => undefined) // layer0 isn't yet there so it will be added
                .mockImplementationOnce(() => layer1),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, goSDKSourceMock, testLayerSpecs);
        sourceWithLayers.ensureAddedToMapWithVisibility(true);
        expect(goSDKSourceMock.ensureAddedToMap).toHaveBeenCalledWith(mapLibreMock);
        expect(mapLibreMock.getLayer).toHaveBeenCalledWith(layer0.id);
        expect(mapLibreMock.getLayer).toHaveBeenCalledWith(layer1.id);
        expect(mapLibreMock.addLayer).toHaveBeenCalledWith({ ...layer0, source: testSourceID }, undefined);
        expect(mapLibreMock.addLayer).toHaveBeenCalledTimes(1);

        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "visible");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible");
    });

    test("ensureAddedToMapWithVisibility with beforeId", () => {
        const goSDKSourceMock = {
            id: testSourceID,
            ensureAddedToMap: jest.fn()
        } as unknown as GOSDKSource;

        const mapLibreMock = {
            getLayer: jest
                .fn()
                .mockImplementationOnce(() => undefined) // layer0 isn't yet there so it will be added
                .mockImplementationOnce(() => undefined),
            addLayer: jest.fn(),
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, goSDKSourceMock, testLayerSpecs);
        sourceWithLayers.ensureAddedToMapWithVisibility(true, "RANDOM_LAYER_ID");
        expect(goSDKSourceMock.ensureAddedToMap).toHaveBeenCalledWith(mapLibreMock);
        expect(mapLibreMock.getLayer).toHaveBeenCalledWith(layer0.id);
        expect(mapLibreMock.getLayer).toHaveBeenCalledWith(layer1.id);
        expect(mapLibreMock.addLayer).toHaveBeenCalledWith({ ...layer0, source: testSourceID }, "RANDOM_LAYER_ID");
        expect(mapLibreMock.addLayer).toHaveBeenCalledWith({ ...layer1, source: testSourceID }, "RANDOM_LAYER_ID");

        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "visible");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible");
    });

    test("isVisible true", () => {
        const mapLibreMock = {
            getLayoutProperty: jest
                .fn()
                .mockImplementationOnce(() => "visible")
                .mockImplementationOnce(() => "none")
        } as unknown as Map;

        let sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible()).toStrictEqual(true);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility");
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledTimes(1);
        // (First layer was visible, so no more need to query layers)

        // ----------------------
        mapLibreMock.getLayoutProperty = jest
            .fn()
            .mockImplementationOnce(() => "none")
            .mockImplementationOnce(() => undefined); // defaults to visible

        sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible()).toStrictEqual(true);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility");
        // First layer was invisible, so we expect the second one to be queried too:
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility");
    });

    test("isVisible true with filter", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockImplementationOnce(() => "visible")
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === layer1.id)).toStrictEqual(true);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility");
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledTimes(1);
    });

    test("isVisible false", () => {
        const mapLibreMock = {
            getLayoutProperty: jest
                .fn()
                .mockImplementationOnce(() => "none")
                .mockImplementationOnce(() => "none")
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible()).toStrictEqual(false);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility");
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility");
    });

    test("isVisible false with filter", () => {
        const mapLibreMock = {
            getLayoutProperty: jest.fn().mockImplementationOnce(() => "none")
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        expect(sourceWithLayers.isAnyLayerVisible((layer) => layer.id === layer1.id)).toStrictEqual(false);
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility");
        expect(mapLibreMock.getLayoutProperty).toHaveBeenCalledTimes(1);
    });

    test("setVisible true", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(true);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "visible");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible");
    });

    test("setVisible true with filter", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(true, (layer) => layer.id === layer1.id);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "visible");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
    });

    test("setVisible false", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(false);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer0.id, "visibility", "none");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "none");
    });

    test("setVisible false with filter", () => {
        const mapLibreMock = {
            setLayoutProperty: jest.fn()
        } as unknown as Map;

        const sourceWithLayers = new SourceWithLayers(mapLibreMock, testGOSDKSource, testLayerSpecs);
        sourceWithLayers.setAllLayersVisible(false, (layer) => layer.id === layer1.id);
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledWith(layer1.id, "visibility", "none");
        expect(mapLibreMock.setLayoutProperty).toHaveBeenCalledTimes(1);
    });
});
