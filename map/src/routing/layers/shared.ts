import type { ExpressionSpecification } from 'maplibre-gl';

/**
 * Main route line foreground color.
 * @ignore
 */
export const ROUTE_LINE_FOREGROUND_COLOR = '#36A8F0';

/**
 * Main route outline color.
 */
export const ROUTE_LINE_OUTLINE_COLOR = '#105287';

/**
 * Deselected route line foreground color.
 * @ignore
 */
export const DESELECTED_FOREGROUND_COLOR = '#ABAFB3';

/**
 * Deselected route line outline color.
 * @ignore
 */
export const DESELECTED_OUTLINE_COLOR = '#3C4956';

/**
 * @ignore
 */
export const DESELECTED_SECONDARY_COLOR = '#727C85';

/**
 * Main route line width based on zoom level.
 * @ignore
 */
export const ROUTE_LINE_FOREGROUND_WIDTH: ExpressionSpecification = [
    'interpolate',
    ['linear'],
    ['zoom'],
    1,
    3,
    5,
    4,
    10,
    7,
    18,
    10,
];

/**
 * Used for showing/hiding layer depending on layer being part of selected route or not.
 *
 * @remarks
 * Add this to layers that depend on whether they are part of the selected route or not.
 *
 * @example:
 * filter: SELECTED_ROUTE_FILTER

 * @group Routing
 */
export const SELECTED_ROUTE_FILTER: ExpressionSpecification = ['==', ['get', 'routeState'], 'selected'];

/**
 * Used for showing/hiding layer depending on layer being part of deselected route or not.
 *
 * @remarks
 * Add this to layers that depend on whether they are part of the deselected route or not.
 *
 * @example:
 * filter: DESELECTED_ROUTE_FILTER

 * @group Routing
 */
export const DESELECTED_ROUTE_FILTER: ExpressionSpecification = ['==', ['get', 'routeState'], 'deselected'];

/**
 * @ignore
 */
export const MAJOR_DELAY_COLOR = '#AD0000';
/**
 * @ignore
 */
export const MODERATE_DELAY_COLOR = '#FB2D09';
/**
 * @ignore
 */
export const MINOR_DELAY_LABEL_COLOR = '#f58240';
/**
 * @ignore
 */
export const UNKNOWN_DELAY_COLOR = '#000000';
