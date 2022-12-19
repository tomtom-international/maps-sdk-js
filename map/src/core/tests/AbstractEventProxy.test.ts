import { LayerSpecification } from "maplibre-gl";
import { AbstractEventProxy } from "../AbstractEventProxy";
import { StyleSourceWithLayers } from "../SourceWithLayers";

// @ts-ignore
const sourceWithLayersTest = {
    source: { id: "SOURCE_ID" },
    layerSpecs: [{ id: "layer0", type: "symbol", source: "SOURCE_ID" } as LayerSpecification]
} as StyleSourceWithLayers;
class TestModule extends AbstractEventProxy {}

describe("AbstractEventProxy tests", () => {
    test("Add one event listener", () => {
        const testModule = new TestModule();

        testModule.addEventListener(sourceWithLayersTest, () => "test", "click");
        expect(testModule.has(sourceWithLayersTest)).toStrictEqual(true);
    });

    test("Remove event listener", () => {
        const testModule = new TestModule();

        testModule.addEventListener(sourceWithLayersTest, () => "test", "click");
        testModule.remove("click", sourceWithLayersTest);
        expect(testModule.has(sourceWithLayersTest)).toStrictEqual(false);
    });

    test("Remove all event listeners", () => {
        const testModule = new TestModule();

        testModule.addEventListener(sourceWithLayersTest, () => "test", "click");
        testModule.removeAll();
        expect(testModule.has(sourceWithLayersTest)).toStrictEqual(false);
    });
});
