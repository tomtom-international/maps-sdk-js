import type { ChargingStationsAvailability } from '@anw/maps-sdk-js/core';
import type { ServiceTemplate } from '../shared';
import { get } from '../shared/fetch';
import { evChargingStationsAvailabilityRequestSchema } from './evChargingStationsAvailabilityRequestSchema';
import { parseEVChargingStationsAvailabilityResponseError } from './evChargingStationsAvailabilityResponseErrorParser';
import { buildEVChargingStationsAvailabilityRequest } from './requestBuilder';
import { parseEVChargingStationsAvailabilityResponse } from './responseParser';
import type { ChargingStationsAvailabilityResponseAPI } from './types/apiTypes';
import type { ChargingStationsAvailabilityParams } from './types/evChargingStationsAvailabilityParams';

/**
 * EV Charging Stations Availability service template type.
 */
export type EVChargingStationsAvailabilityTemplate = ServiceTemplate<
    ChargingStationsAvailabilityParams,
    URL,
    ChargingStationsAvailabilityResponseAPI,
    ChargingStationsAvailability | undefined
>;

/**
 * EV Charging Stations Availability service template main implementation.
 */
export const evChargingStationsAvailabilityTemplate: EVChargingStationsAvailabilityTemplate = {
    requestValidation: { schema: evChargingStationsAvailabilityRequestSchema },
    buildRequest: buildEVChargingStationsAvailabilityRequest,
    sendRequest: get,
    parseResponse: parseEVChargingStationsAvailabilityResponse,
    parseResponseError: parseEVChargingStationsAvailabilityResponseError,
};
