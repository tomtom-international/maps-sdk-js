import { ChargingPark, ChargingPointStatus, ChargingStation, CommonPlaceProps, Connector } from "../..";

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
export type EVChargingStationsAvailability = {
    /**
     * The ID of the returned entity.
     */
    chargingParkId: string;

    /**
     * Charging stations.
     * * Each station can have one or multiple charging points.
     */
    chargingStations: ChargingStation[];

    /**
     * Charging point - based availability counts for these charging stations.
     * * Useful if you want to quickly display how many charging points are in each availability state.
     * * Derived from chargingPoints.
     */
    chargingPointAvailability: ChargingPointAvailability;

    /**
     * Connector-based availability counts for these charging stations.
     * * Useful if you want to quickly display how many connector+power types are in each availability state.
     * * Derived from chargingPoints.
     */
    connectorAvailabilities: ConnectorAvailability[];
};

/**
 * @group Place
 * @category Types
 */
export type ChargingParkWithAvailability = ChargingPark & {
    /**
     * EV Charging Station Availability.
     * * Usually coming from a call to the EV Charging Station Availability service.
     */
    availability?: EVChargingStationsAvailability;
};

/**
 * @group Place
 * @category Types
 */
export type EVChargingStationPlaceProps = Omit<CommonPlaceProps, "chargingPark"> & {
    /**
     * Charging park with charging availability information, when available.
     */
    chargingPark?: ChargingParkWithAvailability;
};
