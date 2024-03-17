import type { LineLayerSpecification } from "maplibre-gl";
import type { LayerSpecTemplate } from "../../shared";
import {
    DESELECTED_FOREGROUND_COLOR,
    DESELECTED_OUTLINE_COLOR,
    DESELECTED_ROUTE_FILTER,
    FOREGROUND_COLOR,
    FOREGROUND_LINE_WIDTH,
    SELECTED_ROUTE_FILTER
} from "./shared";

/**
 * @ignore
 */
export const routeLineBaseTemplate: LayerSpecTemplate<LineLayerSpecification> = {
    type: "line",
    layout: {
        "line-join": "round",
        "line-cap": "round",
        "line-sort-key": ["get", "index"]
    }
};

/**
 * @ignore
 */
export const routeDeselectedOutline: LayerSpecTemplate<LineLayerSpecification> = {
    ...routeLineBaseTemplate,
    filter: DESELECTED_ROUTE_FILTER,
    paint: {
        "line-color": DESELECTED_OUTLINE_COLOR,
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 4, 5, 5, 10, 9, 18, 13]
    }
};

/**
 * @ignore
 */
export const routeDeselectedLine: LayerSpecTemplate<LineLayerSpecification> = {
    ...routeLineBaseTemplate,
    filter: DESELECTED_ROUTE_FILTER,
    paint: {
        "line-color": DESELECTED_FOREGROUND_COLOR,
        "line-width": FOREGROUND_LINE_WIDTH
    }
};

/**
 * @ignore
 */
export const routeOutline: LayerSpecTemplate<LineLayerSpecification> = {
    ...routeLineBaseTemplate,
    filter: SELECTED_ROUTE_FILTER,
    paint: {
        "line-color": "#FFFFFF",
        "line-width": ["interpolate", ["linear"], ["zoom"], 1, 6, 5, 7, 10, 11, 18, 15]
    }
};

/**
 * @ignore
 */
export const routeMainLine: LayerSpecTemplate<LineLayerSpecification> = {
    ...routeLineBaseTemplate,
    filter: SELECTED_ROUTE_FILTER,
    paint: {
        "line-color": FOREGROUND_COLOR,
        "line-width": FOREGROUND_LINE_WIDTH
    }
};

/**
 * @ignore
 */
export const SELECTED_SUMMARY_POPUP_IMAGE_ID = "selected-route-summary-popup";
/**
 * @ignore
 */
export const DESELECTED_SUMMARY_POPUP_IMAGE_ID = "deselected-route-summary-popup";
