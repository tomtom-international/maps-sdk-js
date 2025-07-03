import type { CommonPlaceProps } from '../place';
import type { ChargingStationsAvailability, ConnectorAvailability } from './chargingStationsAvailability';
import type { Connector } from './connector';

/**
 * @group Place
 * @category Types
 */
export type ChargingPark = {
    /**
     * The connectors offered in this charging park.
     */
    connectors: Connector[];
    /**
     * Counts per connector+power combinations. Useful to quickly display the available connectors.
     *
     * They do not contain real time availability.
     * * When EV real time availability is present, use it instead of this one.
     */
    connectorCounts: Omit<ConnectorAvailability, 'statusCounts'>[];
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
    availability?: ChargingStationsAvailability;
};

/**
 * @group Place
 * @category Types
 */
export type EVChargingStationPlaceProps = Omit<CommonPlaceProps, 'chargingPark'> & {
    /**
     * Charging park with charging availability information, when available.
     */
    chargingPark?: ChargingParkWithAvailability;
};
