import type { GeographyType, HasLngLat, MapcodeType, View } from '@tomtom-org/maps-sdk/core';

import type { CommonServiceParams } from '../../shared';
import type { ReverseGeocodingResponseAPI } from './apiTypes';

/**
 * Road use classification types for filtering reverse geocoding results.
 *
 * @remarks
 * Use these values to restrict reverse geocoding results to specific road types.
 *
 * @group Reverse Geocoding
 */
export type RoadUse = 'LimitedAccess' | 'Arterial' | 'Terminal' | 'Ramp' | 'Rotary' | 'LocalStreet';

/**
 * Required parameters for reverse geocoding requests.
 *
 * @remarks
 * These parameters must be provided for any reverse geocoding service call.
 *
 * @group Reverse Geocoding
 */
export type ReverseGeocodingMandatoryParams = {
    /**
     * Geographic position to reverse geocode.
     *
     * @remarks
     * The longitude and latitude coordinates for which to retrieve address information.
     * Accepts any format implementing the {@link HasLngLat} interface.
     */
    position: HasLngLat;
};

/**
 * Optional parameters for customizing reverse geocoding requests.
 *
 * @remarks
 * These parameters allow fine-tuning of the reverse geocoding behavior,
 * including filtering, formatting, and additional data retrieval.
 *
 * @group Reverse Geocoding
 */
export type ReverseGeocodingOptionalParams = {
    /**
     * Controls newline formatting in the returned address.
     *
     * @remarks
     * When `true`, the formatted address will contain newline characters.
     * When `false` or omitted, newlines are converted to spaces.
     *
     * @defaultValue `false`
     */
    allowFreeformNewline?: boolean;

    /**
     * Filters results to specific geography entity types.
     *
     * @remarks
     * Narrows the search to specified geography types (e.g., country, state, city).
     * The response includes the geography ID, which can be used to retrieve the geometry.
     *
     * **Note:** When set, the following parameters are ignored:
     * - `heading`
     * - `number`
     * - `returnRoadUse`
     * - `returnSpeedLimit`
     * - `roadUse`
     * - `returnMatchType`
     */
    geographyType?: GeographyType[];

    /**
     * Directional heading of the vehicle in degrees.
     *
     * @remarks
     * Specifies the travel direction along a road segment to provide
     * direction-aware address information.
     *
     * - `0` = North
     * - `90` = East
     * - `180` = South
     * - `270` = West
     *
     * @example
     * ```ts
     * heading: 90.5  // Traveling east-northeast
     * ```
     *
     * @minimum -360
     * @maximum 360
     */
    heading?: number;

    /**
     * Enables mapcode inclusion in the response.
     *
     * @remarks
     * Returns a comma-separated list of mapcodes for the location.
     * Mapcodes are short codes representing specific locations within a few meters.
     * Can filter to show only selected mapcode types.
     *
     * Available types:
     * - `Local` - Territory-specific mapcode
     * - `International` - Globally valid mapcode
     * - `Alternative` - Alternative mapcode representations
     *
     * @see {@link https://www.mapcode.com | Mapcode Project}
     */
    mapcodes?: MapcodeType[];

    /**
     * Street number for enhanced address matching.
     *
     * @remarks
     * When provided, the response may include:
     * - Side of the street (Left/Right)
     * - Offset position for the street number
     *
     * @example
     * ```ts
     * number: "123"
     * ```
     */
    number?: string;

    /**
     * Search radius in meters from the specified position.
     *
     * @remarks
     * Limits the search area using the provided coordinates as the center point.
     * Must be a positive integer value.
     *
     * @minimum 1
     */
    radiusMeters?: number;

    /**
     * Includes match type information in the response.
     *
     * @remarks
     * When `true`, the response includes details about how well the
     * geocoder matched the provided coordinates to an address.
     *
     * @defaultValue `false`
     */
    returnMatchType?: boolean;

    /**
     * Includes road use classification in the response.
     *
     * @remarks
     * When `true` and reverse geocoding at street level, returns an array
     * of applicable road use types for the location.
     *
     * @defaultValue `false`
     */
    returnRoadUse?: boolean;

    /**
     * Includes speed limit information in the response.
     *
     * @remarks
     * When `true`, returns the speed limit at the given location if available.
     *
     * @defaultValue `false`
     */
    returnSpeedLimit?: boolean;

    /**
     * Restricts results to specific road use types.
     *
     * @remarks
     * Filters reverse geocoding results to only include addresses
     * on roads matching the specified use classifications.
     *
     * @example
     * ```ts
     * roadUses: ['LimitedAccess', 'Arterial']  // Only highways and major roads
     * ```
     */
    roadUses?: RoadUse[];

    /**
     * Specifies the geopolitical view for the results.
     *
     * @remarks
     * Determines how disputed territories and borders are represented in the response.
     *
     * Available views:
     * - `Unified` - International view (default)
     * - `AR` - Argentina
     * - `IN` - India
     * - `PK` - Pakistan
     * - `IL` - Israel
     * - `MA` - Morocco
     * - `RU` - Russia
     * - `TR` - Turkey
     * - `CN` - China
     *
     * @defaultValue `"Unified"`
     */
    view?: View;
};

/**
 * Complete parameter set for reverse geocoding service calls.
 *
 * @remarks
 * Combines common service parameters with reverse geocoding-specific
 * mandatory and optional parameters.
 *
 * @group Reverse Geocoding
 */
export type ReverseGeocodingParams = CommonServiceParams<URL, ReverseGeocodingResponseAPI> &
    ReverseGeocodingMandatoryParams &
    ReverseGeocodingOptionalParams;
