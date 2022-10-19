import { SymbolLayerSpecification } from "maplibre-gl";
import { commonTextSize, defaultIconSize, MAP_BOLD_FONT } from "../../core/layers/CommonLayerProps";
import { LayerSpecTemplate } from "../../core";

export const placesLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: "symbol",
    layout: {
        "text-field": ["get", "title"],
        "text-anchor": "top",
        "text-offset": [0, 0.5],
        "text-font": [MAP_BOLD_FONT],
        "text-size": commonTextSize,
        "text-padding": 5,
        "text-optional": true,
        "icon-image": ["get", "iconID"],
        "icon-anchor": "bottom",
        "icon-overlap": "always",
        "icon-padding": 0,
        "icon-size": defaultIconSize
    },
    paint: {
        "text-color": "#333333",
        "text-halo-color": "#FFFFFF",
        "text-halo-width": ["interpolate", ["linear"], ["zoom"], 6, 1, 10, 1.5],
        "text-translate-anchor": "viewport",
        "icon-translate": [0, 5],
        "icon-translate-anchor": "viewport"
    }
};
