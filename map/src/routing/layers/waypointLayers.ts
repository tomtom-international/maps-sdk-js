import type { ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { MAP_BOLD_FONT } from '../../shared/layers/commonLayerProps';
import {
    ICON_ID,
    pinIconBaseLayout,
    pinIconBasePaint,
    pinTextBaseLayout,
    pinTextBasePaint,
} from '../../shared/layers/symbolLayers';
import { INDEX_TYPE, MIDDLE_INDEX, STOP_DISPLAY_INDEX } from '../types/waypointDisplayProps';

/**
 * Waypoint start image ID.
 * @group Routing
 */
export const WAYPOINT_START_IMAGE_ID = 'waypointStart';
/**
 * Waypoint stop image ID.
 *
 * @remarks
 * Used for intermediate waypoints in a route.
 *
 * @group Routing.
 */
export const WAYPOINT_STOP_IMAGE_ID = 'waypointStop';
/**
 * Soft waypoint image ID.
 *
 * @remarks
 * This is currently unsupported in Orbis maps.
 *
 * @group Routing
 */
export const WAYPOINT_SOFT_IMAGE_ID = 'waypointSoft';
/**
 * Waypoint finish image ID.
 *
 * @group Routing
 */
export const WAYPOINT_FINISH_IMAGE_ID = 'waypointFinish';

const isSoftWaypoint: ExpressionSpecification = [
    'all',
    ['==', ['get', INDEX_TYPE], MIDDLE_INDEX],
    ['!', ['has', STOP_DISPLAY_INDEX]],
];

const pinIndexLabelPaint: SymbolLayerSpecification['paint'] = {
    'text-color': '#ffffff',
};

const pinIndexLabelLayout: SymbolLayerSpecification['layout'] = {
    // optional centered text to indicate stop numbers (1, 2 ...):
    'text-field': ['get', STOP_DISPLAY_INDEX],
    'text-font': [MAP_BOLD_FONT],
    'text-size': ['interpolate', ['linear'], ['zoom'], 13, 14, 18, 16],
    'text-offset': [0, -1.6],
    // pin vs circle:
    'icon-anchor': [
        'case',
        isSoftWaypoint,
        'center',
        // else
        'bottom',
    ],
    'text-allow-overlap': true,
};

// TODO: reusable display of pins with indexes, not just waypoints
/**
 * @ignore
 */
export const waypointSymbols: LayerSpecTemplate<SymbolLayerSpecification> = {
    type: 'symbol',
    paint: {
        ...pinIconBasePaint,
        ...pinIndexLabelPaint,
    },
    layout: {
        ...pinIconBaseLayout,
        ...pinIndexLabelLayout,
        'symbol-sort-key': [
            'case',
            ['==', ['get', ICON_ID], WAYPOINT_SOFT_IMAGE_ID],
            0,
            ['abs', ['-', ['get', 'index'], 1000]],
        ],
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
