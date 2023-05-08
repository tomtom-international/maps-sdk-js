import { EVChargingStationsAvailability } from "@anw/maps-sdk-js/core";
import { ServiceTemplate } from "../shared";
import { EVChargingStationsAvailabilityParams } from "./types/evChargingStationsAvailabilityParams";
import { buildEVChargingStationsAvailabilityRequest } from "./requestBuilder";
import { parseEVChargingStationsAvailabilityResponse } from "./responseParser";
import { get } from "../shared/fetch";
import { evChargingStationsAvailabilityRequestSchema } from "./evChargingStationsAvailabilityRequestSchema";
import { parseEVChargingStationsAvailabilityResponseError } from "./evChargingStationsAvailabilityResponseErrorParser";

/**
 * EV Charging Stations Availability service template type.
 */
export type EVChargingStationsAvailabilityTemplate = ServiceTemplate<
    EVChargingStationsAvailabilityParams,
    URL,
    EVChargingStationsAvailability,
    EVChargingStationsAvailability
>;

/**
 * EV Charging Stations Availability service template main implementation.
 */
export const evChargingStationsAvailabilityTemplate: EVChargingStationsAvailabilityTemplate = {
    requestValidation: { schema: evChargingStationsAvailabilityRequestSchema },
    buildRequest: buildEVChargingStationsAvailabilityRequest,
    sendRequest: get,
    parseResponse: parseEVChargingStationsAvailabilityResponse,
    parseResponseError: parseEVChargingStationsAvailabilityResponseError
};
