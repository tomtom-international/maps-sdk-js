import type {
    ChargingPointAvailability,
    ChargingPointStatus,
    ChargingStation,
    Connector,
    ConnectorAvailability,
    ConnectorCount,
} from '@tomtom-org/maps-sdk/core';

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

const addConnectorCount = (
    connectors: Connector[] | undefined,
    counts: ConnectorCount[], // we are mutating this input
): void => {
    if (!connectors) {
        // defensive check, sometimes connectors are undefined
        return;
    }
    for (const connector of connectors) {
        const existingCount = counts.find((connectorCount) => areEqual(connector, connectorCount.connector));
        if (existingCount) {
            existingCount.count++;
        } else {
            // new count entry:
            counts.push({ connector, count: 1 });
        }
    }
};

const addConnectorCountAndStatus = (
    connectors: Connector[] | undefined,
    status: ChargingPointStatus | undefined,
    availabilities: ConnectorAvailability[], // we are mutating this input
): void => {
    if (!connectors) {
        // defensive check, sometimes connectors are undefined
        return;
    }
    for (const connector of connectors) {
        const existingAvailability = availabilities.find((connectorAvailability) =>
            areEqual(connector, connectorAvailability.connector),
        );
        if (existingAvailability) {
            existingAvailability.count++;
            if (status) {
                // we're mutating the input object here:
                const statusCounts = existingAvailability.statusCounts;
                existingAvailability.statusCounts[status] = (statusCounts[status] || 0) + 1;
            }
        } else {
            // new availability entry:
            availabilities.push({ connector, count: 1, statusCounts: status ? { [status]: 1 } : {} });
        }
    }
};

/**
 * @ignore
 */
export const toConnectorCounts = (connectors: Connector[]): ConnectorCount[] => {
    const availabilities: ConnectorAvailability[] = [];
    addConnectorCount(connectors, availabilities);
    return availabilities;
};

/**
 * @ignore
 */
export const toConnectorBasedAvailabilities = (chargingStations: ChargingStation[]): ConnectorAvailability[] => {
    const availabilities: ConnectorAvailability[] = [];
    for (const station of chargingStations) {
        for (const chargingPoint of station.chargingPoints) {
            addConnectorCountAndStatus(chargingPoint.connectors, chargingPoint.status, availabilities);
        }
    }
    return availabilities;
};
