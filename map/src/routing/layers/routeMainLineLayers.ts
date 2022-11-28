import { ExpressionSpecification, LineLayerSpecification } from "maplibre-gl";
import { LayerSpecTemplate } from "../../core";
import { FOREGROUND_COLOR } from "./shared";

const MAIN_LINE_WIDTH: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 1, 3, 5, 4, 10, 7, 18, 10];

const baseLineLayerSpec: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    layout: {
        "line-join": "round",
        "line-cap": "round"
    }
};

export const routeLineForegroundSpec: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseLineLayerSpec,
    paint: {
        "line-color": FOREGROUND_COLOR,
        "line-width": MAIN_LINE_WIDTH
    }
};

export const routeLineBackgroundSpec: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseLineLayerSpec,
    paint: {
        "line-color": "#FFFFFF",
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 6, 5, 7, 10, 11, 18, 15]
    }
};
