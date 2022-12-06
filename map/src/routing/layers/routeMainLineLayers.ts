import { LineLayerSpecification } from "maplibre-gl";
import { LayerSpecTemplate } from "../../core";
import { FOREGROUND_COLOR, FOREGROUND_LINE_WIDTH } from "./shared";

/**
 * @ignore
 */
export const baseMainLineLayer: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    layout: {
        "line-join": "round",
        "line-cap": "round"
    }
};

/**
 * @ignore
 */
export const routeOutline: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseMainLineLayer,
    paint: {
        "line-color": "#FFFFFF",
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 6, 5, 7, 10, 11, 18, 15]
    }
};

/**
 * @ignore
 */
export const routeMainLine: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseMainLineLayer,
    paint: {
        "line-color": FOREGROUND_COLOR,
        "line-width": FOREGROUND_LINE_WIDTH
    }
};
