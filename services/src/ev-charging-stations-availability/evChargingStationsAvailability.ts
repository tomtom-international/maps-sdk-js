import type {
    ChargingPark,
    ChargingStationsAvailability,
    EVChargingStationPlaceProps,
    Place,
    Places,
} from '@tomtom-org/maps-sdk/core';
import { bboxFromGeoJSON } from '@tomtom-org/maps-sdk/core';
import { callService } from '../shared/serviceTemplate';
import type { EVChargingStationsAvailabilityTemplate } from './evChargingStationsAvailabilityTemplate';
import { evChargingStationsAvailabilityTemplate } from './evChargingStationsAvailabilityTemplate';
import type { ChargingStationsAvailabilityParams } from './types/evChargingStationsAvailabilityParams';

/**
 * Get real-time availability of electric vehicle charging stations.
 *
 * Provides current operational status of charging points and connectors at EV charging parks,
 * enabling drivers to find available chargers before arriving at a location.
 *
 * @remarks
 * Key information returned:
 * - **Point-level status**: Available, Occupied, Reserved, Out of Service
 * - **Connector details**: Power ratings, plug types, current availability
 * - **Aggregated counts**: Quick overview of available vs occupied chargers
 * - **Access information**: Public, private, or restricted access
 * - **Opening hours**: When the charging facility is accessible
 *
 * Use cases:
 * - EV navigation apps: Show available chargers along routes
 * - Charging station maps: Display real-time availability
 * - Trip planning: Verify chargers will be available at destination
 * - Fleet management: Monitor charging infrastructure status
 *
 * @param params - Charging availability parameters with station ID
 * @param customTemplate - Advanced customization for request/response handling
 *
 * @returns Promise resolving to charging station availability information
 *
 * @example
 * ```typescript
 * // Get availability for a specific charging park
 * const availability = await evChargingStationsAvailability({
 *   key: 'your-api-key',
 *   id: 'charging-park-id-123'
 * });
 *
 * // Check how many chargers are available
 * const availableCount = availability.chargingPointAvailability.statusCounts.Available;
 * console.log(`${availableCount} chargers available`);
 *
 * // Find available CCS connectors
 * const ccsConnectors = availability.connectorAvailabilities.find(
 *   ca => ca.connector.type === 'IEC62196Type2CCS'
 * );
 * ```
 *
 * @see [EV Charging Availability API](https://docs.tomtom.com/search-api/documentation)
 * @see [Places Quickstart Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/quickstart)
 * @see [EV Charging Stations Availability Guide](https://docs.tomtom.com/maps-sdk-js/guides/services/places/ev-charging-stations-availability)
 *
 * @group EV Charging
 */
export const evChargingStationsAvailability = async (
    params: ChargingStationsAvailabilityParams,
    customTemplate?: Partial<EVChargingStationsAvailabilityTemplate>,
): Promise<ChargingStationsAvailability | undefined> =>
    callService(
        params,
        { ...evChargingStationsAvailabilityTemplate, ...customTemplate },
        'EVChargingStationsAvailability',
    );

/**
 * Enhance a place with real-time EV charging availability data.
 *
 * Fetches availability information for an EV charging station and merges it into
 * the place properties. Non-EV places are returned unchanged.
 *
 * @param place - The place to enhance with availability data
 *
 * @returns Promise resolving to the place with merged availability information
 *
 * @example
 * ```typescript
 * // After search, enhance place with availability
 * const searchResult = await search({ query: 'EV charging', ... });
 * const place = searchResult.features[0];
 *
 * const enhancedPlace = await buildPlaceWithEVAvailability(place);
 * const availability = enhancedPlace.properties.chargingPark?.availability;
 *
 * if (availability) {
 *   console.log('Available chargers:', availability.chargingPointAvailability.count);
 * }
 * ```
 *
 * @group EV Charging
 */
export const buildPlaceWithEVAvailability = async (place: Place): Promise<Place<EVChargingStationPlaceProps>> => {
    const availabilityId = place.properties.dataSources?.chargingAvailability?.id;
    if (!availabilityId) {
        return place;
    }
    try {
        const availability = await evChargingStationsAvailability({ id: availabilityId });
        const poi = place.properties.poi;
        return availability
            ? {
                  ...place,
                  properties: {
                      ...place.properties,
                      // We override poi opening hours with the ones from the EV call, which might be better supported:
                      ...(poi && { poi: { ...poi, openingHours: availability.openingHours } }),
                      chargingPark: {
                          ...(place.properties.chargingPark as ChargingPark),
                          availability,
                      },
                  },
              }
            : place;
    } catch (e) {
        // (Likely a QPS limit error)
        console.error(e);
        return place;
    }
};

/**
 * Enhance multiple places with real-time EV charging availability data.
 *
 * Fetches availability information for all EV charging stations in a collection
 * and merges it into their properties. Non-EV places are returned unchanged.
 *
 * @remarks
 * **Important**: Availability requests are made sequentially to avoid exceeding
 * API rate limits (QPS - Queries Per Second). For large result sets, this may
 * take some time.
 *
 * @param places - Collection of places to enhance
 * @param options - Configuration options
 *
 * @returns Promise resolving to places collection with merged availability
 *
 * @example
 * ```typescript
 * // Search for charging stations and add availability
 * const results = await search({
 *   query: 'EV charging',
 *   at: [4.9, 52.3],
 *   radius: 5000
 * });
 *
 * const withAvailability = await buildPlacesWithEVAvailability(results, {
 *   includeIfAvailabilityUnknown: false  // Filter out stations with unknown availability
 * });
 *
 * // Display only stations with known availability
 * withAvailability.features.forEach(place => {
 *   const available = place.properties.chargingPark?.availability?.chargingPointAvailability.count;
 *   console.log(`${place.properties.poi?.name}: ${available} chargers`);
 * });
 * ```
 *
 * @group EV Charging
 */
export const buildPlacesWithEVAvailability = async (
    places: Places,
    options: {
        /**
         * If true, places with unknown availability will be still included. Otherwise, they will be filtered out.
         * @default true
         */
        includeIfAvailabilityUnknown: boolean;
    } = { includeIfAvailabilityUnknown: true },
): Promise<Places<EVChargingStationPlaceProps>> => {
    const placesWithAvailability = [];
    for (const place of places.features) {
        // (We fetch the availabilities sequentially on purpose to prevent QPS limit errors)
        const placeWithAvailability = await buildPlaceWithEVAvailability(place);
        if (placeWithAvailability.properties.chargingPark?.availability || options.includeIfAvailabilityUnknown) {
            placesWithAvailability.push(placeWithAvailability);
        }
    }
    return { ...places, features: placesWithAvailability, bbox: bboxFromGeoJSON(placesWithAvailability) };
};

export default evChargingStationsAvailability;
