import { LayerSpecTemplate } from "../../core";
import { LineLayerSpecification } from "maplibre-gl";
import { FOREGROUND_COLOR, FOREGROUND_LINE_WIDTH } from "./shared";
import { baseMainLineLayer } from "./routeMainLineLayers";

/**
 * @ignore
 */
export const routeVehicleRestrictedBackgroundLine: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseMainLineLayer,
    paint: {
        "line-color": "#12537D",
        "line-width": FOREGROUND_LINE_WIDTH
    }
};

/**
 * @ignore
 */
export const routeVehicleRestrictedDottedLine: LayerSpecTemplate<LineLayerSpecification> = {
    ...baseMainLineLayer,
    paint: {
        "line-color": FOREGROUND_COLOR,
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 2, 5, 3, 10, 5, 18, 7],
        "line-dasharray": [0, 1.5]
    }
};
