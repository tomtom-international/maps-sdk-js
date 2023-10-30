import { LayerSpecification } from "maplibre-gl";
import { getLayerGroupFilter } from "../layerGroups";

describe("Tests for logic related to layer group filtering", () => {
    test("get layer group filters with no inputs", () => {
        expect(getLayerGroupFilter()).toBeUndefined();
        expect(getLayerGroupFilter([])).toBeUndefined();
    });

    const testLayers = [
        { id: "Buildings - Outline", type: "line" },
        { id: "3D - Building", type: "fill-extrusion" },
        { id: "Landuse - Sport", type: "fill" },
        { id: "Landcover - Global", type: "fill" },
        { id: "House Number", type: "symbol" },
        { id: "Places - Medium city", type: "symbol" },
        { id: "Places - Large city", type: "symbol" },
        { id: "Places - Capital", type: "symbol" },
        { id: "Places - State name", type: "symbol" },
        { id: "Places - Country name", type: "symbol" },
        { id: "Tunnel - Railway outline", type: "line" },
        { id: "TransitLabels - Road Shield 3", type: "symbol" }
    ] as LayerSpecification[];

    test("get layer group filters", () => {
        expect(testLayers.filter(getLayerGroupFilter(["land"])!)).toEqual([
            { id: "Landuse - Sport", type: "fill" },
            { id: "Landcover - Global", type: "fill" }
        ]);

        expect(testLayers.filter(getLayerGroupFilter(["buildings2D"])!)).toEqual([
            { id: "Buildings - Outline", type: "line" }
        ]);

        expect(testLayers.filter(getLayerGroupFilter(["houseNumbers", "buildings2D", "buildings3D"])!)).toEqual([
            { id: "Buildings - Outline", type: "line" },
            { id: "3D - Building", type: "fill-extrusion" },
            { id: "House Number", type: "symbol" }
        ]);

        expect(testLayers.filter(getLayerGroupFilter(["placeLabels"])!)).toEqual([
            { id: "Places - Medium city", type: "symbol" },
            { id: "Places - Large city", type: "symbol" },
            { id: "Places - Capital", type: "symbol" },
            { id: "Places - State name", type: "symbol" },
            { id: "Places - Country name", type: "symbol" }
        ]);

        expect(testLayers.filter(getLayerGroupFilter(["cityLabels", "capitalLabels"])!)).toEqual([
            { id: "Places - Medium city", type: "symbol" },
            { id: "Places - Large city", type: "symbol" },
            { id: "Places - Capital", type: "symbol" }
        ]);

        expect(testLayers.filter(getLayerGroupFilter(["countryLabels"])!)).toEqual([
            { id: "Places - Country name", type: "symbol" }
        ]);
    });
});
