import { LayerSpecification } from "maplibre-gl";
import { AbstractEventProxy } from "../AbstractEventProxy";
import { StyleSourceWithLayers } from "../SourceWithLayers";

const sourceWithLayersMock = {
    source: { id: "SOURCE_ID" },
    layerSpecs: [{ id: "layer0", type: "symbol", source: "SOURCE_ID" } as LayerSpecification]
} as StyleSourceWithLayers;

class TestModule extends AbstractEventProxy {}

describe("AbstractEventProxy tests", () => {
    test("Add one event handler", () => {
        const testModule = new TestModule();

        testModule.addEventHandler(sourceWithLayersMock, () => "test", "click");
        expect(testModule.has(sourceWithLayersMock)).toStrictEqual(true);

        // @ts-ignore
        expect(testModule.ensureAdded(undefined)).toBeUndefined();
    });

    test("Check if has any handler registered", () => {
        const testModule = new TestModule();

        testModule.addEventHandler(sourceWithLayersMock, () => "test", "click");
        expect(testModule.hasAnyHandlerRegistered(sourceWithLayersMock.source.id)).toBeTruthy();

        testModule.removeAll();
        expect(testModule.hasAnyHandlerRegistered(sourceWithLayersMock.source.id)).toBeFalsy();
    });

    test("Remove event handler", () => {
        const testModule = new TestModule();

        testModule.addEventHandler(sourceWithLayersMock, () => "test", "click");
        testModule.remove("click", sourceWithLayersMock);
        expect(testModule.has(sourceWithLayersMock)).toStrictEqual(false);
    });

    test("Remove all event handlers", () => {
        const testModule = new TestModule();

        testModule.addEventHandler(sourceWithLayersMock, () => "test", "click");
        testModule.removeAll();
        expect(testModule.has(sourceWithLayersMock)).toStrictEqual(false);
    });
});
