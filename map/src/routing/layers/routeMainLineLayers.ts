import { LineLayerSpecification } from "maplibre-gl";
import { LayerSpecTemplate } from "../../core";
import { FOREGROUND_COLOR, FOREGROUND_LINE_WIDTH } from "./shared";

const baseLineLayerSpec: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    layout: {
        "line-join": "round",
        "line-cap": "round"
    }
};

/**
 * @ignore
 */
export const routeLineForegroundSpec: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseLineLayerSpec,
    paint: {
        "line-color": FOREGROUND_COLOR,
        "line-width": FOREGROUND_LINE_WIDTH
    }
};

/**
 * @ignore
 */
export const routeLineBackgroundSpec: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseLineLayerSpec,
    paint: {
        "line-color": "#FFFFFF",
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 6, 5, 7, 10, 11, 18, 15]
    }
};
