import { ExpressionSpecification } from "maplibre-gl";

/**
 * Main route color.
 * @ignore
 */
export const FOREGROUND_COLOR = "#3f9cd9";

/**
 * Main route line width based on zoom level.
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
 * Used for showing/hiding layer depending on layer being part of selected route or not.
 * @ignore
 */
export const SELECTED_ROUTE_FILTER: ExpressionSpecification = ["==", ["get", "routeStyle"], "selected"];

/**
 * Used for hiding/showing layer depending on layer being part of selected route or not.
 * @ignore
 */
export const DESELECTED_ROUTE_FILTER: ExpressionSpecification = ["==", ["get", "routeStyle"], "deselected"];
