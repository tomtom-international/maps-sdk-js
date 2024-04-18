import type { LatLonAPI } from "../../shared/types/apiPlacesResponseTypes";

/**
 * @ignore
 */
export type EVChargingStationAPI = {
    id: string;
    name: string;
    position: LatLonAPI;
    chargingStations: string;
};

/**
 * @ignore
 */
export type EvChargingStationsSearchResponseAPI = {
    summary: {
        numResults: number;
        offset: number;
        totalResults: number;
    };
    results: EVChargingStationAPI[];
};
