import type { LineLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { ROUTE_LINE_FOREGROUND_WIDTH, SELECTED_ROUTE_FILTER } from './shared';

/**
 * @ignore
 */
export const routeTunnelsLine: LayerSpecTemplate<LineLayerSpecification> = {
    filter: SELECTED_ROUTE_FILTER,
    type: 'line',
    layout: {
        'line-join': 'round',
    },
    paint: {
        'line-width': ROUTE_LINE_FOREGROUND_WIDTH,
        'line-color': '#000000',
        'line-opacity': 0.3,
    },
};
