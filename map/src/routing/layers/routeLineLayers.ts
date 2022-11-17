import { LayerSpecTemplate } from "../../core";
import { LineLayerSpecification } from "maplibre-gl";
import { FOREGROUND_COLOR } from "./shared";

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
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 3, 5, 4, 10, 7, 18, 10]
    }
};

export const routeLineBackgroundSpec: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseLineLayerSpec,
    paint: {
        "line-color": "#FFFFFF",
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 6, 5, 7, 10, 11, 18, 15]
    }
};
