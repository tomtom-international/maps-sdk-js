import type { OpeningHours } from '../poi/openingHours';
import type { ChargingPointStatus, ChargingStation, ChargingStationsAccessType } from './chargingStation';
import type { Connector } from './connector';

/**
 * @group Place
 * @category Types
 */
export type ChargingPointAvailability = {
    /**
     * The number of charging points or connectors, depending on the context of this object.
     */
    count: number;
    /**
     * The counts of charging points or connectors for each charging point status,
     * depending on the context of this object.
     */
    statusCounts: Partial<Record<ChargingPointStatus, number>>;
};

/**
 * @group Place
 * @category Types
 */
export type ConnectorAvailability = ChargingPointAvailability & {
    connector: Connector;
};

/**
 * Real-time EV charging station availability information.
 * @group Place
 * @category Types
 */
export type ChargingStationsAvailability = {
    /**
     * The ID of the returned entity.
     */
    id: string;

    /**
     * Charging stations.
     * * Each station can have one or multiple charging points.
     */
    chargingStations: ChargingStation[];

    /**
     * Charging point - based availability counts for these charging stations.
     * * Useful if you want to quickly display how many charging points are in each availability state.
     * * Derived from chargingPoints within chargingStations.
     */
    chargingPointAvailability: ChargingPointAvailability;

    /**
     * Connector-based availability counts for these charging stations.
     * * Useful if you want to quickly display how many connector+power types are in each availability state.
     * * Derived from chargingPoints within chargingStations.
     */
    connectorAvailabilities: ConnectorAvailability[];

    /**
     * Access type of the EV charging stations ("Public", "Authorized", "Restricted", "Private", "Unknown")
     */
    accessType: ChargingStationsAccessType;

    /**
     * Opening hours of the EV charging stations.
     */
    openingHours?: OpeningHours;
};
