import type {
    ChargingPointAvailability,
    ChargingPointStatus,
    ChargingStation,
    Connector,
    ConnectorAvailability,
} from '@anw/maps-sdk-js/core';

/**
 * @ignore
 */
export const toChargingPointAvailability = (chargingStations: ChargingStation[]): ChargingPointAvailability => {
    const availability: ChargingPointAvailability = { count: 0, statusCounts: {} };
    for (const station of chargingStations) {
        for (const chargingPoint of station.chargingPoints) {
            availability.count++;
            availability.statusCounts[chargingPoint.status] =
                (availability.statusCounts[chargingPoint.status] || 0) + 1;
        }
    }
    return availability;
};

// Two connectors can be considered equal when they have the same type and power:
const areEqual = (connectorA: Connector, connectorB: Connector) =>
    connectorA.type === connectorB.type && connectorA.ratedPowerKW === connectorB.ratedPowerKW;

const addConnectorStatus = (
    connectors: Connector[],
    status: ChargingPointStatus | undefined,
    availabilities: ConnectorAvailability[],
): void => {
    for (const connector of connectors) {
        const existingAvailability = availabilities.find((connectorAvailability) =>
            areEqual(connector, connectorAvailability.connector),
        );
        if (existingAvailability) {
            existingAvailability.count++;
            if (status) {
                const statusCounts = existingAvailability.statusCounts;
                statusCounts[status] = (statusCounts[status] || 0) + 1;
            }
        } else {
            availabilities.push({
                connector,
                count: 1,
                statusCounts: status
                    ? {
                          [status]: 1,
                      }
                    : {},
            });
        }
    }
};

/**
 * @ignore
 */
export const toConnectorCounts = (connectors: Connector[]): ConnectorAvailability[] => {
    const availabilities: ConnectorAvailability[] = [];
    addConnectorStatus(connectors, undefined, availabilities);
    return availabilities;
};

/**
 * @ignore
 */
export const toConnectorBasedAvailabilities = (chargingStations: ChargingStation[]): ConnectorAvailability[] => {
    const availabilities: ConnectorAvailability[] = [];
    for (const station of chargingStations) {
        for (const chargingPoint of station.chargingPoints) {
            addConnectorStatus(chargingPoint.connectors, chargingPoint.status, availabilities);
        }
    }
    return availabilities;
};
