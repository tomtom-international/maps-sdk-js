import type { LineLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import type { RouteWidth } from '../types/routeModuleConfig';
import { getTollRoadOutlineWidth, SELECTED_ROUTE_FILTER } from './shared';

/**
 * @ignore
 */
export const routeTollRoadsOutline = (routeWidth?: RouteWidth): LayerSpecTemplate<LineLayerSpecification> => ({
    filter: SELECTED_ROUTE_FILTER,
    type: 'line',
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    },
    paint: {
        'line-width': getTollRoadOutlineWidth(routeWidth),
        'line-color': '#BEBFFA',
    },
});

/**
 * @ignore
 */
export const routeTollRoadsSymbol: LayerSpecTemplate<SymbolLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: 'symbol',
    minzoom: 4,
    layout: {
        'symbol-placement': 'point',
        'symbol-avoid-edges': true,
        'icon-image': 'poi-toll_plaza',
        'icon-size': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 16.5, 1],
    },
};
