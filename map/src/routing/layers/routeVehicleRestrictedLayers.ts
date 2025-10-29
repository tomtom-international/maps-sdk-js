import type { LineLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import {
    ROUTE_LINE_FOREGROUND_COLOR,
    ROUTE_LINE_FOREGROUND_WIDTH,
    ROUTE_LINE_OUTLINE_COLOR,
    SELECTED_ROUTE_FILTER,
} from './shared';

/**
 * @ignore
 */
export const routeVehicleRestrictedBackgroundLine: LayerSpecTemplate<LineLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: 'line',
    layout: {
        'line-join': 'round',
    },
    paint: {
        'line-color': ROUTE_LINE_OUTLINE_COLOR,
        'line-width': ROUTE_LINE_FOREGROUND_WIDTH,
    },
};

/**
 * @ignore
 */
export const routeVehicleRestrictedDottedLine: LayerSpecTemplate<LineLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: 'line',
    layout: {
        'line-join': 'round',
        'line-cap': 'round',
    },
    paint: {
        'line-color': ROUTE_LINE_FOREGROUND_COLOR,
        'line-width': ['interpolate', ['linear'], ['zoom'], 1, 2, 5, 3, 10, 5, 18, 7],
        'line-dasharray': [0, 1.5],
    },
};
