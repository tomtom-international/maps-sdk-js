import type { ExpressionSpecification, SymbolLayerSpecification } from 'maplibre-gl';
import type { LayerSpecTemplate } from '../../shared';
import { MAP_BOLD_FONT } from '../../shared/layers/commonLayerProps';
import {
    pinIconBaseLayout,
    pinIconBasePaint,
    pinTextBaseLayout,
    pinTextBasePaint,
    TITLE,
} from '../../shared/layers/symbolLayers';
import { STOP_DISPLAY_INDEX } from '../types/waypointDisplayProps';
import { hasStopDuration, stopDurationLabelSection } from '../util/stopDuration';

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
 * Waypoint finish image ID.
 *
 * @group Routing
 */
export const WAYPOINT_FINISH_IMAGE_ID = 'waypointFinish';

// `title` is often absent -- a waypoint given as bare coordinates has no name -- so the newline
// between the two is only emitted when both are actually there. The duration itself is styled by
// `stopDurationLabelSection`, which the charging-stop pins use too.
const waypointLabelTextField: ExpressionSpecification = [
    'format',
    ['coalesce', ['get', TITLE], ''],
    {},
    ['case', ['all', ['has', TITLE], hasStopDuration], '\n', ''],
    {},
    ...stopDurationLabelSection,
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
    'icon-anchor': 'bottom',
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
        'symbol-sort-key': ['abs', ['-', ['get', 'index'], 1000]],
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
        'text-field': waypointLabelTextField,
        'text-anchor': 'top',
        'text-offset': [0, 0.4],
    },
};
