import { EVChargingStationsAvailability } from "@anw/go-sdk-js/core";
import { ServiceTemplate } from "../shared";
import { EVChargingStationsAvailabilityParams } from "./types/EVChargingStationsAvailabilityParams";
import { buildEVChargingStationsAvailabilityRequest } from "./RequestBuilder";
import { parseEVChargingStationsAvailabilityResponse } from "./ResponseParser";
import { get } from "../shared/Fetch";
import { evChargingStationsAvailabilityRequestSchema } from "./EVChargingStationsAvailabilityRequestSchema";
import { parseEVChargingStationsAvailabilityResponseError } from "./EVChargingStationsAvailabilityResponseErrorParser";

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
