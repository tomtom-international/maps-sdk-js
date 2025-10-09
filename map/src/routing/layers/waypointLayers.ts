import type { ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { MAP_BOLD_FONT } from '../../shared/layers/commonLayerProps';
import { ICON_ID, pinLayerBaseSpec, pinTextBaseLayout, pinTextBasePaint } from '../../shared/layers/symbolLayers';
import { INDEX_TYPE, MIDDLE_INDEX, STOP_DISPLAY_INDEX } from '../types/waypointDisplayProps';

export const WAYPOINT_START_IMAGE_ID = 'waypointStart';
export const WAYPOINT_STOP_IMAGE_ID = 'waypointStop';
export const WAYPOINT_SOFT_IMAGE_ID = 'waypointSoft';
export const WAYPOINT_FINISH_IMAGE_ID = 'waypointFinish';

const isSoftWaypoint: ExpressionSpecification = [
    'all',
    ['==', ['get', INDEX_TYPE], MIDDLE_INDEX],
    ['!', ['has', STOP_DISPLAY_INDEX]],
];

/**
 * @ignore
 */
export const waypointSymbols: LayerSpecTemplate<SymbolLayerSpecification> = {
    ...pinLayerBaseSpec,
    type: 'symbol',
    paint: {
        ...pinLayerBaseSpec.paint,
        'text-color': '#ffffff',
    },
    layout: {
        ...pinLayerBaseSpec.layout,
        'symbol-sort-key': [
            'case',
            ['==', ['get', ICON_ID], WAYPOINT_SOFT_IMAGE_ID],
            0,
            ['abs', ['-', ['get', 'index'], 1000]],
        ],
        // optional centered text to indicate stop numbers (1, 2 ...):
        'text-field': ['get', STOP_DISPLAY_INDEX],
        'text-font': [MAP_BOLD_FONT],
        'text-size': ['interpolate', ['linear'], ['zoom'], 13, 13, 18, 15],
        'text-anchor': 'bottom',
        'text-offset': [0, -1.1],
        'icon-image': ['get', ICON_ID],
        // pin vs circle:
        'icon-anchor': [
            'case',
            isSoftWaypoint,
            'center',
            // else
            'bottom',
        ],
        'text-allow-overlap': true,
        'icon-allow-overlap': true,
    },
};

/**
 * @ignore
 */
export const waypointLabels: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: 'symbol',
    paint: {
        ...pinTextBasePaint,
        'text-color': 'black',
        'text-halo-width': 1.5,
        'text-halo-color': '#ffffff',
    },
    layout: {
        ...pinTextBaseLayout,
        'text-anchor': 'top',
        'text-offset': [0, 0.4],
    },
};
