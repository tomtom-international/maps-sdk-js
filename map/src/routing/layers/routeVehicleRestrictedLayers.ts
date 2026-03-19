import type { LineLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import type { RouteWidth } from '../types/routeModuleConfig';
import {
    getLineForegroundWidth,
    ROUTE_LINE_FOREGROUND_COLOR,
    ROUTE_LINE_OUTLINE_COLOR,
    SELECTED_ROUTE_FILTER,
} from './shared';

/**
 * @ignore
 */
export const routeVehicleRestrictedBackgroundLine = (
    routeWidth?: RouteWidth,
): LayerSpecTemplate<LineLayerSpecification> => ({
    filter: SELECTED_ROUTE_FILTER,
    type: 'line',
    layout: {
        'line-join': 'round',
    },
    paint: {
        'line-color': ROUTE_LINE_OUTLINE_COLOR,
        'line-width': getLineForegroundWidth(routeWidth),
    },
});

/**
 * @ignore
 */
export const routeVehicleRestrictedDottedLine = (
    routeWidth?: RouteWidth,
): LayerSpecTemplate<LineLayerSpecification> => ({
    filter: SELECTED_ROUTE_FILTER,
    type: 'line',
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    },
    paint: {
        'line-color': ROUTE_LINE_FOREGROUND_COLOR,
        'line-width': getLineForegroundWidth(routeWidth),
        'line-dasharray': [0, 1.5],
    },
});
