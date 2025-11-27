import type { CommonServiceParams } from '../../shared';
import type { ChargingStationsAvailabilityResponseAPI } from './apiTypes';

/**
 * Parameters for the EV Charging Stations Availability service.
 *
 * Fetches real-time availability status of charging points at an EV charging park.
 *
 * @remarks
 * **Key Information Returned:**
 * - Charging point availability status (Available, Occupied, Reserved, Out of Service)
 * - Connector details (power ratings, plug types)
 * - Aggregated availability counts
 * - Access restrictions
 * - Opening hours
 *
 * @example
 * ```typescript
 * // Basic usage
 * const params: ChargingStationsAvailabilityParams = {
 *   key: 'your-api-key',
 *   id: 'charging-park-id-from-search'
 * };
 *
 * // From search result
 * const searchResult = await search({ query: 'EV charging' });
 * const chargingParkId = searchResult.features[0].properties.dataSources?.chargingAvailability?.id;
 *
 * const params: ChargingStationsAvailabilityParams = {
 *   key: 'your-api-key',
 *   id: chargingParkId
 * };
 * ```
 *
 * @group EV Charging
 */
export type ChargingStationsAvailabilityParams = CommonServiceParams<URL, ChargingStationsAvailabilityResponseAPI> & {
    /**
     * The charging availability ID.
     *
     * @remarks
     * This ID is obtained from a previous Search API request, specifically from
     * the `dataSources.chargingAvailability.id` field of a charging station place.
     *
     * **How to Get the ID:**
     * 1. Search for EV charging stations
     * 2. Extract the ID from `place.properties.dataSources.chargingAvailability.id`
     * 3. Use this ID to fetch real-time availability
     *
     * @example
     * ```typescript
     * // From search result
     * const place = searchResults.features[0];
     * const id = place.properties.dataSources?.chargingAvailability?.id;
     *
     * // Use in availability request
     * id: 'US-12345-CHGID-001'
     * ```
     */
    id: string;
};
