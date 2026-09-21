import type { ExpressionSpecification } from 'maplibre-gl';
import { MAP_REGULAR_FONT } from '../../shared/layers/commonLayerProps';

// Display property holding how long a route stands still at a stop, ready to render. Shared by the
// two kinds of pin that can carry one: a waypoint the caller asked to wait at, and a charging stop
// the routing service planned. Both mean the same thing to a reader — how long you are here — so
// both use this one property, formatted and styled the same way.
const STOP_DURATION = 'stopDuration';

// Secondary text colour: the duration reads as data beside the stop's name, not as part of it.
const STOP_DURATION_COLOR = '#727C85';

/**
 * The stop duration as a secondary section of a pin label — muted, and in the regular weight while
 * the rest of the label is bold.
 *
 * @remarks
 * Spread into a `format` expression, after whatever separator the label needs.
 *
 * @ignore
 */
export const stopDurationLabelSection: [ExpressionSpecification, Record<string, unknown>] = [
    ['coalesce', ['get', STOP_DURATION], ''],
    { 'text-color': STOP_DURATION_COLOR, 'text-font': ['literal', [MAP_REGULAR_FONT]] },
];

/**
 * @ignore
 */
export const hasStopDuration: ExpressionSpecification = ['has', STOP_DURATION];
