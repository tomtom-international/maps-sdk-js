import { ExpressionSpecification } from "maplibre-gl";

/**
 * @ignore
 */
export const FOREGROUND_COLOR = "#3f9cd9";

/**
 * @ignore
 */
export const FOREGROUND_LINE_WIDTH: ExpressionSpecification = [
    "interpolate",
    ["linear"],
    ["zoom"],
    1,
    3,
    5,
    4,
    10,
    7,
    18,
    10
];

/**
 * @ignore
 */
export const SELECTED_ROUTE_FILTER: ExpressionSpecification = ["==", ["get", "routeStyle"], "selected"];

/**
 * @ignore
 */
export const DESELECTED_ROUTE_FILTER: ExpressionSpecification = ["==", ["get", "routeStyle"], "deselected"];
