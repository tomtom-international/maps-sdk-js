import type { ExpressionSpecification } from 'maplibre-gl';
import type { RouteWaypointSize, RouteWidth } from '../types/routeModuleConfig';

/**
 * Main route line foreground color.
 * @ignore
 */
export const ROUTE_LINE_FOREGROUND_COLOR = '#36A8F0';

/**
 * Main route outline color.
 * @ignore
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
 * Main route line outline width (medium) based on zoom level.
 * @ignore
 */
export const ROUTE_LINE_OUTLINE_WIDTH: ExpressionSpecification = [
    'interpolate',
    ['linear'],
    ['zoom'],
    1,
    5,
    5,
    6,
    10,
    10,
    18,
    14,
];

const LINE_FOREGROUND_WIDTHS: Record<RouteWidth, ExpressionSpecification> = {
    s: ['interpolate', ['linear'], ['zoom'], 1, 2, 5, 3, 10, 5, 18, 7],
    m: ROUTE_LINE_FOREGROUND_WIDTH,
    l: ['interpolate', ['linear'], ['zoom'], 1, 5, 5, 6, 10, 11, 18, 15],
};

const LINE_OUTLINE_WIDTHS: Record<RouteWidth, ExpressionSpecification> = {
    s: ['interpolate', ['linear'], ['zoom'], 1, 4, 5, 5, 10, 8, 18, 11],
    m: ROUTE_LINE_OUTLINE_WIDTH,
    l: ['interpolate', ['linear'], ['zoom'], 1, 7, 5, 9, 10, 14, 18, 19],
};

const WAYPOINT_ICON_SIZES: Record<RouteWaypointSize, ExpressionSpecification> = {
    s: ['interpolate', ['linear'], ['zoom'], 8, 0.45, 22, 0.6],
    m: ['interpolate', ['linear'], ['zoom'], 8, 0.6, 22, 0.8],
    l: ['interpolate', ['linear'], ['zoom'], 8, 0.75, 22, 1],
};

/**
 * Returns the foreground line width expression for the given size preset.
 * @ignore
 */
export const getLineForegroundWidth = (size?: RouteWidth): ExpressionSpecification =>
    LINE_FOREGROUND_WIDTHS[size ?? 'm'];

/**
 * Returns the outline line width expression for the given size preset.
 * @ignore
 */
export const getLineOutlineWidth = (size?: RouteWidth): ExpressionSpecification => LINE_OUTLINE_WIDTHS[size ?? 'm'];

/**
 * Returns the waypoint icon size expression for the given size preset.
 * @ignore
 */
export const getWaypointIconSize = (size?: RouteWaypointSize): ExpressionSpecification =>
    WAYPOINT_ICON_SIZES[size ?? 'm'];

const TOLL_ROAD_OUTLINE_WIDTHS: Record<RouteWidth, ExpressionSpecification> = {
    s: ['interpolate', ['linear'], ['zoom'], 1, 8, 5, 9, 10, 12, 18, 15],
    m: ['interpolate', ['linear'], ['zoom'], 1, 9, 5, 11, 10, 15, 18, 20],
    l: ['interpolate', ['linear'], ['zoom'], 1, 12, 5, 14, 10, 19, 18, 24],
};

/**
 * Returns the toll road outline width expression for the given size preset.
 * @ignore
 */
export const getTollRoadOutlineWidth = (size?: RouteWidth): ExpressionSpecification =>
    TOLL_ROAD_OUTLINE_WIDTHS[size ?? 'm'];

const INSTRUCTION_LINE_WIDTHS: Record<RouteWidth, ExpressionSpecification> = {
    s: ['interpolate', ['linear'], ['zoom'], 16, 8, 22, 12],
    m: ['interpolate', ['linear'], ['zoom'], 16, 12, 22, 17],
    l: ['interpolate', ['linear'], ['zoom'], 16, 17, 22, 24],
};

const INSTRUCTION_OUTLINE_WIDTHS: Record<RouteWidth, ExpressionSpecification> = {
    s: ['interpolate', ['linear'], ['zoom'], 16, 10, 22, 14],
    m: ['interpolate', ['linear'], ['zoom'], 16, 14, 22, 20],
    l: ['interpolate', ['linear'], ['zoom'], 16, 20, 22, 28],
};

/**
 * Returns the instruction line width expression for the given size preset.
 * @ignore
 */
export const getInstructionLineWidth = (size?: RouteWidth): ExpressionSpecification =>
    INSTRUCTION_LINE_WIDTHS[size ?? 'm'];

/**
 * Returns the instruction outline width expression for the given size preset.
 * @ignore
 */
export const getInstructionOutlineWidth = (size?: RouteWidth): ExpressionSpecification =>
    INSTRUCTION_OUTLINE_WIDTHS[size ?? 'm'];

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
export const MINOR_DELAY_COLOR = '#FFC105';
/**
 * @ignore
 */
export const MINOR_DELAY_LABEL_COLOR = '#f58240';
/**
 * @ignore
 */
export const UNKNOWN_DELAY_COLOR = '#000000';
/**
 * @ignore
 */
export const UNKNOWN_DELAY_BG_COLOR = '#C7D2D8';
/**
 * Dashed-line color for `magnitudeOfDelay === 'unknown'` (rendered as a red dashed overlay).
 * @ignore
 */
export const UNKNOWN_DELAY_DASH_COLOR = 'rgba(190, 39, 27, 1)';
/**
 * Dashed-line color for `magnitudeOfDelay === 'indefinite'` (rendered as a gray dashed overlay).
 * @ignore
 */
export const INDEFINITE_DELAY_DASH_COLOR = 'rgba(137, 150, 168, 1)';
