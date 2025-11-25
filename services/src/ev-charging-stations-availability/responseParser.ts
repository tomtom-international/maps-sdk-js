import type { ChargingStation, ChargingStationsAvailability } from '@tomtom-org/maps-sdk/core';
import { toChargingSpeed } from '../shared/ev';
import { parseOpeningHours } from '../shared/searchResultParsing';
import { toChargingPointAvailability, toConnectorBasedAvailabilities } from './connectorAvailability';
import type { ChargingStationsAvailabilityResponseAPI } from './types/apiTypes';

const toChargingPointStations = (stations: ChargingStation[]) =>
    stations.map((station) => ({
        ...station,
        chargingPoints: station.chargingPoints.map((chargingPoint) => ({
            ...chargingPoint,
            connectors: chargingPoint.connectors?.map((connector) => ({
                ...connector,
                chargingSpeed: toChargingSpeed(connector.ratedPowerKW),
            })),
        })),
    }));

/**
 * Default method for parsing ev charging stations availability from {@link ChargingStationsAvailability}
 * @param apiResponse
 */
export const parseEVChargingStationsAvailabilityResponse = (
    apiResponse: ChargingStationsAvailabilityResponseAPI,
): ChargingStationsAvailability | undefined => {
    const result = apiResponse.results?.[0];
    return result
        ? {
              id: result.id,
              accessType: result.accessType,
              chargingStations: toChargingPointStations(result.chargingStations),
              chargingPointAvailability: toChargingPointAvailability(result.chargingStations),
              connectorAvailabilities: toConnectorBasedAvailabilities(result.chargingStations),
              ...(result.openingHours && { openingHours: parseOpeningHours(result.openingHours) }),
          }
        : undefined;
};
