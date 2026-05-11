import type { TrafficIncidentCategory } from '@tomtom-org/maps-sdk/core';
import type { ExpressionSpecification } from 'maplibre-gl';
import { INDEFINITE_DELAY_DASH_COLOR, UNKNOWN_DELAY_DASH_COLOR } from '../../routing/layers/shared';

/**
 * Maps a traffic incident category to the sprite-image ID used by the map style.
 * Returns `null` for categories that have no dedicated icon (e.g. `jam`, which
 * uses a dynamic `traffic-jam-<magnitude>-<size>` image instead).
 *
 * @ignore
 */
export const incidentIconID = (category: TrafficIncidentCategory): string | null => {
    switch (category) {
        case 'accident':
            return 'traffic-incidents-accident';
        case 'roadworks':
            return 'traffic-incidents-roadworks';
        case 'road-closed':
            return 'traffic-incidents-road_closed';
        case 'lane-closed':
        case 'narrow-lanes':
            return 'traffic-incidents-lane_closed';
        case 'danger':
        case 'animals-on-road':
            return 'traffic-incidents-danger';
        case 'broken-down-vehicle':
            return 'traffic-incidents-broken_down_vehicle';
        case 'wind':
            return 'traffic-incidents-wind';
        case 'fog':
            return 'traffic-incidents-fog';
        case 'rain':
            return 'traffic-incidents-rain';
        case 'frost':
            return 'traffic-incidents-frost';
        case 'flooding':
            return 'traffic-incidents-flooding';
        default:
            return null;
    }
};

/**
 * MapLibre filter selecting incident features whose `magnitudeOfDelay` should be
 * drawn with the dashed overlay (i.e. no concrete severity). Used by the routing
 * module's traffic-section overlay — the canonical-style
 * {@link TrafficIncidentOverlayModule} renders unknown/indefinite magnitudes with
 * `line-pattern` sprites instead of dashed overlays.
 *
 * @ignore
 */
export const severityDashedFilter: ExpressionSpecification = [
    'in',
    ['get', 'magnitudeOfDelay'],
    ['literal', ['unknown', 'indefinite']],
];

/**
 * MapLibre paint expression for the dashed overlay's color. `'unknown'` is
 * rendered red (indicating reported-but-unconfirmed severity); `'indefinite'`
 * is rendered gray (indicating open-ended delay with no end time).
 *
 * @ignore
 */
export const severityLineDashColor: ExpressionSpecification = [
    'match',
    ['get', 'magnitudeOfDelay'],
    'unknown',
    UNKNOWN_DELAY_DASH_COLOR,
    // other (indefinite):
    INDEFINITE_DELAY_DASH_COLOR,
];
