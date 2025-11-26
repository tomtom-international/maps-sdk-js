import type { OpeningHours } from '../poi/openingHours';
import type { ChargingPointStatus, ChargingStation, ChargingStationsAccessType } from './chargingStation';
import type { Connector } from './connector';

/**
 * Has a number representing a count.
 *
 * @group Place
 */
export type HasCount = {
    /**
     * Number representing the count of items.
     */
    count: number;
};

/**
 * Aggregated availability count for charging points or connectors.
 *
 * Provides a summary of how many units are in each operational status.
 *
 * @example
 * ```typescript
 * const availability: ChargingPointAvailability = {
 *   count: 10,  // Total of 10 charging points
 *   statusCounts: {
 *     Available: 6,
 *     Occupied: 3,
 *     OutOfService: 1
 *   }
 * };
 * ```
 *
 * @group Place
 */
export type ChargingPointAvailability = HasCount & {
    /**
     * Breakdown of units by operational status.
     *
     * Maps each status to the number of units in that status.
     * Only includes statuses that have at least one unit.
     *
     * @example
     * ```typescript
     * statusCounts: {
     *   Available: 5,
     *   Occupied: 2,
     *   OutOfService: 1
     * }
     * ```
     */
    statusCounts: Partial<Record<ChargingPointStatus, number>>;
};

/**
 * Has an Electric vehicle charging connector.
 *
 * @group Place
 */
export type HasConnector = {
    /**
     * Electric vehicle charging connector.
     */
    connector: Connector;
};

/**
 * Availability information for a specific connector type.
 *
 * Extends ChargingPointAvailability with connector specifications,
 * useful for displaying available connectors grouped by type and power.
 *
 * @example
 * ```typescript
 * const connectorAvailability: ConnectorAvailability = {
 *   connector: {
 *     type: 'IEC62196Type2CCS',
 *     ratedPowerKW: 150,
 *     // ... other connector properties
 *   },
 *   count: 4,
 *   statusCounts: {
 *     Available: 3,
 *     Occupied: 1
 *   }
 * };
 * ```
 *
 * @group Place
 */
export type ConnectorAvailability = HasConnector & ChargingPointAvailability;

/**
 * Count information for a specific connector type.
 *
 * @group Place
 */
export type ConnectorCount = HasConnector & HasCount;

/**
 * Real-time availability information for EV charging stations.
 *
 * Provides comprehensive status information including individual charging points,
 * aggregated availability by connector type, and access information.
 *
 * @remarks
 * This data is typically retrieved from the EV Charging Stations Availability service
 * and provides real-time operational status. Use this to:
 * - Display available charging points on a map
 * - Filter by connector type and status
 * - Show aggregated availability statistics
 * - Check if a station is accessible and open
 *
 * @example
 * ```typescript
 * const availability: ChargingStationsAvailability = {
 *   id: 'charging-park-123',
 *   chargingStations: [...],  // Individual stations with detailed status
 *   chargingPointAvailability: {
 *     count: 10,
 *     statusCounts: { Available: 7, Occupied: 3 }
 *   },
 *   connectorAvailabilities: [
 *     { connector: { type: 'IEC62196Type2CCS', ratedPowerKW: 150, ... }, count: 4, ... },
 *     { connector: { type: 'Chademo', ratedPowerKW: 50, ... }, count: 2, ... }
 *   ],
 *   accessType: 'Public',
 *   openingHours: { mode: 'nextSevenDays', ... }
 * };
 * ```
 *
 * @group Place
 */
export type ChargingStationsAvailability = {
    /**
     * Unique identifier for the charging park or facility.
     *
     * Matches the ID used to request availability information.
     */
    id: string;

    /**
     * Array of charging stations with detailed point-level status.
     *
     * Each station contains individual charging points with real-time status,
     * capabilities, and connector information. Use this for detailed views
     * showing the status of each charging point.
     */
    chargingStations: ChargingStation[];

    /**
     * Aggregated availability counts across all charging points.
     *
     * Provides a quick summary of total charging points and their statuses.
     * Useful for displaying overall availability without iterating through
     * individual stations and points.
     *
     * @example
     * ```typescript
     * // Display: "7 of 10 chargers available"
     * const total = chargingPointAvailability.count;
     * const available = chargingPointAvailability.statusCounts.Available || 0;
     * ```
     */
    chargingPointAvailability: ChargingPointAvailability;

    /**
     * Availability grouped by connector type and power level.
     *
     * Useful for displaying connector-specific availability, allowing users
     * to quickly see if their required connector type is available.
     *
     * @example
     * ```typescript
     * // Find availability for CCS Type 2 connectors
     * const ccsAvailability = connectorAvailabilities.find(
     *   ca => ca.connector.type === 'IEC62196Type2CCS'
     * );
     * ```
     */
    connectorAvailabilities: ConnectorAvailability[];

    /**
     * Access level for these charging stations.
     *
     * Indicates if stations are public, require authorization, or have restrictions.
     */
    accessType: ChargingStationsAccessType;

    /**
     * Operating hours for the charging facility.
     *
     * Indicates when the charging park is accessible. Note that even if chargers
     * are available 24/7, the facility itself may have restricted access hours.
     */
    openingHours?: OpeningHours;
};
