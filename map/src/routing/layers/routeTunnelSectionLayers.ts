import { LineLayerSpecification } from "maplibre-gl";
import { FOREGROUND_LINE_WIDTH } from "./shared";
import { LayerSpecTemplate } from "../../core";

/**
 * @ignore
 */
export const routeTunnelsLine: LayerSpecTemplate<LineLayerSpecification> = {
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
