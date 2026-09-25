import type { GeographyType, HasLngLat, View } from '@tomtom-org/maps-sdk/core';

import type { CommonServiceParams, GetObject } from '../../shared';
import type { ReverseGeocodingResponseAPI } from './apiTypes';

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
     * Filters results to specific geography entity types.
     *
     * @remarks
     * Narrows the search to specified geography types (e.g., country, state, city).
     *
     * **Note:** When set, `heading` is ignored.
     */
    geographyType?: GeographyType[];

    /**
     * Directional heading of the vehicle in degrees.
     *
     * @remarks
     * Specifies the travel direction along a road segment to provide
     * direction-aware address information. Ignored when `geographyType` is set.
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
     * Specifies the geopolitical view for the results.
     *
     * @remarks
     * Determines how disputed territories and borders are represented in the response.
     *
     * Available views:
     * - `Unified` - International view (default)
     * - `AR` - Argentina
     * - `CN` - China
     * - `IL` - Israel
     * - `IN` - India
     * - `MA` - Morocco
     * - `PK` - Pakistan
     * - `RS` - Serbia
     * - `RU` - Russia
     * - `TR` - Turkey
     * - `TW` - Taiwan
     *
     * `MA` is accepted by this type but is not supported by the current backend.
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
export type ReverseGeocodingParams = CommonServiceParams<GetObject, ReverseGeocodingResponseAPI> &
    ReverseGeocodingMandatoryParams &
    ReverseGeocodingOptionalParams;
