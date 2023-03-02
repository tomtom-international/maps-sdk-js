import { ChargingPointAvailability, ConnectorAvailability, ChargingStation } from "@anw/go-sdk-js/core";

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

/**
 * @ignore
 */
export const toConnectorBasedAvailabilities = (chargingStations: ChargingStation[]): ConnectorAvailability[] => {
    const availabilities: ConnectorAvailability[] = [];
    for (const station of chargingStations) {
        for (const chargingPoint of station.chargingPoints) {
            for (const connector of chargingPoint.connectors) {
                const existingAvailability = availabilities.find(
                    (connectorAvailability) =>
                        connector.type == connectorAvailability.connector.type &&
                        connector.ratedPowerKW == connectorAvailability.connector.ratedPowerKW
                );
                if (existingAvailability) {
                    existingAvailability.count++;
                    const statusCounts = existingAvailability.statusCounts;
                    statusCounts[chargingPoint.status] = (statusCounts[chargingPoint.status] || 0) + 1;
                } else {
                    availabilities.push({
                        connector,
                        count: 1,
                        statusCounts: {
                            [chargingPoint.status]: 1
                        }
                    });
                }
            }
        }
    }
    return availabilities;
};
