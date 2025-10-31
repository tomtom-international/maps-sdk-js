import type { ChargingStation, ChargingStationsAccessType, TimeZone } from '@tomtom-org/maps-sdk/core';
import type { LatLonAPI, OpeningHoursAPI } from '../../shared/types/apiPlacesResponseTypes';

/**
 * @ignore
 */
export type EVChargingStationResultAPI = {
    id: string;
    name: string;
    position: LatLonAPI;
    openingHours: OpeningHoursAPI;
    timeZone: TimeZone;
    accessType: ChargingStationsAccessType;
    chargingStations: ChargingStation[];
};

/**
 * @ignore
 */
export type ChargingStationsAvailabilityResponseAPI = {
    summary: {
        numResults: number;
        offset: number;
        totalResults: number;
    };
    results?: EVChargingStationResultAPI[];
};
