import { LayerSpecTemplate } from "../../core";
import { LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";

/**
 * @ignore
 */
export const routeTollRoadsOutline: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    layout: {
        "line-join": "round",
        "line-cap": "round"
    },
    paint: {
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 9, 5, 11, 10, 15, 18, 20],
        "line-color": "#BEBFFA"
    }
};

/**
 * @ignore
 */
export const routeTollRoadsSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: "symbol",
    minzoom: 4,
    layout: {
        "symbol-placement": "point",
        "symbol-avoid-edges": true,
        "icon-image": "284",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 4, 0.8, 16.5, 1]
    }
};
