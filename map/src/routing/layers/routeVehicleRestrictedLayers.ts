import { LineLayerSpecification } from "maplibre-gl";
import { LayerSpecTemplate } from "../../shared";
import { FOREGROUND_COLOR, FOREGROUND_LINE_WIDTH, SELECTED_ROUTE_FILTER } from "./shared";

/**
 * @ignore
 */
export const routeVehicleRestrictedBackgroundLine: LayerSpecTemplate<LineLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: "line",
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-color": "#12537D",
        "line-width": FOREGROUND_LINE_WIDTH
    }
};

/**
 * @ignore
 */
export const routeVehicleRestrictedDottedLine: LayerSpecTemplate<LineLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: "line",
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-color": FOREGROUND_COLOR,
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 2, 5, 3, 10, 5, 18, 7],
        "line-dasharray": [0, 1.5]
    }
};
