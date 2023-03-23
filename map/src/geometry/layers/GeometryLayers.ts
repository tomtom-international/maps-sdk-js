import { FillLayerSpecification, LineLayerSpecification } from "maplibre-gl";
import { LayerSpecTemplate } from "../../shared";

export const ColorPalettes = {
    warm: [
        "#793F0D",
        "#AC703D",
        "#C38E63",
        "#E49969",
        "#E5AE86",
        "#EEC5A9",
        "#6E7649",
        "#9D9754",
        "#C7C397",
        "#B4A851",
        "#DFD27C",
        "#E7E3B5",
        "#846D74",
        "#B7A6AD",
        "#D3C9CE"
    ],
    cold: ["#344464", "#548ca4", "#549cac", "#2c445c", "#a4ccd4", "#acbccc", "#b4c4d4", "#acd4cc", "#5c8ca4"]
};

export type ColorPaletteOptions = keyof typeof ColorPalettes;

const defaultColor = "#0A3653";

export const geometryFillSpec: LayerSpecTemplate<FillLayerSpecification> = {
    type: "fill",
    paint: {
        "fill-color": defaultColor,
        "fill-opacity": 0.15,
        "fill-antialias": false
    }
};

export const geometryOutlineSpec: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    paint: {
        "line-color": defaultColor,
        "line-opacity": 0.45,
        "line-width": 2
    }
};
