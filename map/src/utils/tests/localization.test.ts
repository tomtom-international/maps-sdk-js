import { layers } from "./localization.data";
import { isLayerLocalizable } from "../localization";
import { SymbolLayerSpecification, LayerSpecification } from "maplibre-gl";

describe("test isLayerLocalizable function", () => {
    const symbolLayers = layers.filter((layerObj) => (layerObj[1] as LayerSpecification).type === "symbol");
    //@ts-ignore
    test.each(symbolLayers)("'%s'", (_name: string, input: SymbolLayerSpecification, output: boolean) => {
        expect(isLayerLocalizable(input)).toBe(output);
    });
});
