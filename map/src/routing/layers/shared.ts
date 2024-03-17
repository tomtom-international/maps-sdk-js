import type { ExpressionSpecification } from "maplibre-gl";

/**
 * Main route line foreground color.
 * @ignore
 */
export const FOREGROUND_COLOR = "#3f9cd9";

/**
 * Deselected route line foreground color.
 */
export const DESELECTED_FOREGROUND_COLOR = "#E0E2E3";

/**
 * Deselected route line outline color.
 */
export const DESELECTED_OUTLINE_COLOR = "#3F4A55";

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

/**
 * @ignore
 */
export const MAJOR_DELAY_COLOR = "#AD0000";
/**
 * @ignore
 */
export const MODERATE_DELAY_COLOR = "#FB2D09";
/**
 * @ignore
 */
export const MINOR_DELAY_LABEL_COLOR = "#f58240";
/**
 * @ignore
 */
export const UNKNOWN_DELAY_COLOR = "#000000";
