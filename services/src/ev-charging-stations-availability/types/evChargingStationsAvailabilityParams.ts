import type { CommonServiceParams } from '../../shared';
import type { ChargingStationsAvailabilityResponseAPI } from './apiTypes';

export type ChargingStationsAvailabilityParams = CommonServiceParams<URL, ChargingStationsAvailabilityResponseAPI> & {
    /**
     * The chargingAvailability ID, previously retrieved from a Search request.
     */
    id: string;
};
