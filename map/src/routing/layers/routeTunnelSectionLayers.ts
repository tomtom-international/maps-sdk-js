import type { LineLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import type { RouteWidth } from '../types/routeModuleConfig';
import { getLineForegroundWidth, SELECTED_ROUTE_FILTER } from './shared';

/**
 * @ignore
 */
export const routeTunnelsLine = (routeWidth?: RouteWidth): LayerSpecTemplate<LineLayerSpecification> => ({
    filter: SELECTED_ROUTE_FILTER,
    type: 'line',
    layout: {
        'line-join': 'round',
    },
    paint: {
        'line-width': getLineForegroundWidth(routeWidth),
        'line-color': '#000000',
        'line-opacity': 0.3,
    },
});
