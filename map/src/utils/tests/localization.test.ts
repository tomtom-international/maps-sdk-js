import { layers } from "./localization.data";
import { localizeMap, isLayerLocalizable } from "../localization";
import { Map, SymbolLayerSpecification, LayerSpecification } from "maplibre-gl";
import { buildMapOptions } from "../../init/BuildMapOptions";

jest.mock("maplibre-gl", () => ({
    Map: jest.fn().mockImplementation(() => ({
        getStyle: jest.fn().mockImplementation(() => ({ layers: layers.map((layerObj) => layerObj[1]) })),
        setLayoutProperty: jest.fn()
    })),
    setRTLTextPlugin: jest.fn(),
    getRTLTextPluginStatus: jest.fn()
}));

describe("Localization utils test with mocked map", () => {
    const mockedContainer = jest.fn() as unknown as HTMLElement;
    test("mocked map style data with different layers", () => {
        const map = new Map(
            buildMapOptions(
                { container: mockedContainer },
                { commonBaseURL: "https://api.tomtom.com", apiKey: "API_KEY" }
            )
        );
        jest.spyOn(map, "setLayoutProperty");
        localizeMap(map, "en_EN");
        expect(map.setLayoutProperty).toHaveBeenCalledTimes(4);
        expect(map.setLayoutProperty).toHaveBeenCalledWith("symbolLayer1", "text-field", [
            "coalesce",
            ["get", "name_en_EN"],
            ["get", "name"]
        ]);
        expect(map.setLayoutProperty).toHaveBeenCalledWith("symbolLayer2", "text-field", [
            "coalesce",
            ["get", "name_en_EN"],
            ["get", "name"]
        ]);
    });
});

describe("test isLayerLocalizable function", () => {
    const symbolLayers = layers.filter((layerObj) => (layerObj[1] as LayerSpecification).type === "symbol");
    //@ts-ignore
    test.each(symbolLayers)("'%s'", (_name: string, input: SymbolLayerSpecification, output: boolean) => {
        expect(isLayerLocalizable(input)).toBe(output);
    });
});
