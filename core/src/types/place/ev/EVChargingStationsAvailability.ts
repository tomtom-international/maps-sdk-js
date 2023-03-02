import { ChargingPark, ChargingPointStatus, ChargingStation, CommonPlaceProps, Connector } from "../..";

/**
 * @group Place
 * @category Types
 */
export type ChargingPointAvailability = {
    count: number;
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
export type EVChargingStationPlaceProps = Omit<CommonPlaceProps, "chargingPark"> & {
    /**
     * Charging park with charging availability information, when available.
     */
    chargingPark?: ChargingPark & {
        /**
         * EV Charging Station Availability.
         * * Usually coming from a call to the EV Charging Station Availability service.
         */
        availability?: EVChargingStationsAvailability;
    };
};
