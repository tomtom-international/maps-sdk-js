import { LineLayerSpecification, SymbolLayerSpecification } from "maplibre-gl";
import { FOREGROUND_LINE_WIDTH } from "./shared";
import { LayerSpecTemplate } from "../../core";

/**
 * @ignore
 */
export const routeFerriesLine: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-width": FOREGROUND_LINE_WIDTH,
        "line-color": "#6dc4ed"
    }
};

/**
 * @ignore
 */
export const routeFerriesSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: "symbol",
    minzoom: 6,
    // zoom where the map POI naturally appears:
    maxzoom: 16.5,
    layout: {
        "symbol-placement": "point",
        "symbol-avoid-edges": true,
        "icon-image": "145",
        "icon-size": ["interpolate", ["linear"], ["zoom"], 6, 0.8, 16.5, 1],
        // helps smooth the transition from along-route to map-poi, which also has a label in it:
        "icon-ignore-placement": true
    }
};
