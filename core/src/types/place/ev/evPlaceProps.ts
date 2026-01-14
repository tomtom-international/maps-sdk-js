import type { CommonPlaceProps } from '../place';
import type { ChargingStationsAvailability, ConnectorCount } from './chargingStationsAvailability';

/**
 * Information about an EV charging park.
 *
 * Describes the charging infrastructure at a location, including available
 * connector types and counts. This is static information about the facility.
 *
 * @example
 * ```typescript
 * const chargingPark: ChargingPark = {
 *   connectors: [
 *     { connector: {...}, count: 4 },
 *     { connector: {...}, count: 2 }
 *   ]
 * };
 * ```
 *
 * @group Place
 */
export type ChargingPark = {
    /**
     * Count of connectors grouped by type and power level.
     *
     * Provides aggregate counts without real-time availability status.
     * This is static infrastructure information about how many of each
     * connector type exist at the location.
     *
     * @remarks
     * For real-time availability, use the availability property instead.
     * This field shows total counts regardless of current operational status.
     */
    connectors: ConnectorCount[];
};

/**
 * Charging park with optional real-time availability data.
 *
 * Combines static infrastructure information with dynamic availability status
 * when available from the EV Charging Station Availability service.
 *
 * @example
 * ```typescript
 * const parkWithAvailability: ChargingParkWithAvailability = {
 *   connectors: [...],
 *   availability: {
 *     id: 'park-123',
 *     chargingStations: [...],
 *     chargingPointAvailability: { count: 10, statusCounts: {...} },
 *     // ... real-time status data
 *   }
 * };
 * ```
 *
 * @group Place
 */
export type ChargingParkWithAvailability = ChargingPark & {
    /**
     * Real-time availability information for this charging park.
     *
     * Present only if availability data has been fetched from the
     * EV Charging Station Availability service. Contains current
     * operational status for all charging points and connectors.
     *
     * @remarks
     * To get availability data:
     * 1. Extract the chargingAvailability ID from place.dataSources
     * 2. Call the EV Charging Stations Availability service
     * 3. Merge the result into this property
     */
    availability: ChargingStationsAvailability;
};

/**
 * Properties for an EV charging station place.
 *
 * Extends common place properties with EV-specific charging park information.
 * Use this type for places that are EV charging locations.
 *
 * @example
 * ```typescript
 * const evPlace: EVChargingStationPlaceProps = {
 *   // Common place properties
 *   id: 'place-123',
 *   type: 'POI',
 *   address: {...},
 *   position: [4.9, 52.3],
 *   // EV-specific properties
 *   chargingPark: {
 *     connectors: [...],
 *     availability: {...}
 *   }
 * };
 * ```
 *
 * @group Place
 */
export type EVChargingStationWithAvailabilityPlaceProps = Omit<CommonPlaceProps, 'chargingPark'> & {
    /**
     * Charging infrastructure and availability information.
     *
     * Contains details about available connectors, counts, and optionally
     * real-time availability status if fetched from the availability service.
     */
    chargingPark: ChargingParkWithAvailability;
};
