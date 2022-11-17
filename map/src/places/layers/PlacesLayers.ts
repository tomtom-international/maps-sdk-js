import { SymbolLayerSpecification } from "maplibre-gl";
import { LayerSpecTemplate } from "../../core";
import { DEFAULT_ICON_SIZE, DEFAULT_TEXT_SIZE, MAP_BOLD_FONT } from "../../core/layers/CommonLayerProps";
import { ICON_ID, TITLE } from "../types/PlaceDisplayProps";

export const placesLayerSpec: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: "symbol",
    layout: {
        "text-field": ["get", TITLE],
        "text-anchor": "top",
        "text-offset": [0, 0.5],
        "text-font": [MAP_BOLD_FONT],
        "text-size": DEFAULT_TEXT_SIZE,
        "text-padding": 5,
        "text-optional": true,
        "icon-image": ["get", ICON_ID],
        "icon-anchor": "bottom",
        "icon-overlap": "always",
        "icon-padding": 0,
        "icon-size": DEFAULT_ICON_SIZE
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
