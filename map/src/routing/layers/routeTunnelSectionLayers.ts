import { LineLayerSpecification } from "maplibre-gl";
import { FOREGROUND_LINE_WIDTH, SELECTED_ROUTE_FILTER } from "./shared";
import { LayerSpecTemplate } from "../../shared";

/**
 * @ignore
 */
export const routeTunnelsLine: LayerSpecTemplate<LineLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: "line",
    layout: {
        "line-join": "round"
    },
    paint: {
        "line-width": FOREGROUND_LINE_WIDTH,
        "line-color": "#000000",
        "line-opacity": 0.3
    }
};
