import type { SymbolLayerSpecification } from "maplibre-gl";
import type { LayerSpecTemplate } from "../../shared";
import { SELECTED_ROUTE_FILTER } from "./shared";
import { MAP_BOLD_FONT } from "../../shared/layers/commonLayerProps";

/**
 * @ignore
 */
export const routeEVChargingStationSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: "symbol",
    minzoom: 6,
    paint: {
        "text-color": "black",
        "text-halo-width": 1.5,
        "text-halo-color": "#ffffff"
    },
    layout: {
        "symbol-placement": "point",
        "symbol-avoid-edges": true,
        "icon-image": ["get", "iconID"],
        "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 16.5, 1],
        // helps smooth the transition from along-route to map-poi, which also has a label in it:
        "icon-ignore-placement": true,
        "icon-allow-overlap": true,
        "text-font": [MAP_BOLD_FONT],
        "text-size": 11,
        "text-anchor": "top",
        "text-offset": [0, 0.8],
        "text-field": ["get", "title"],
        "text-optional": true
    }
};
