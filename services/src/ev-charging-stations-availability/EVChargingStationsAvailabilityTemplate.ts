import { ServiceTemplate } from "../shared";
import { EVChargingStationsAvailabilityParams } from "./types/EVChargingStationsAvailabilityParams";
import { EVChargingStationsAvailabilityResponse } from "./types/EVChargingStationsAvailabilityResponse";
import { buildEVChargingStationsAvailabilityRequest } from "./RequestBuilder";
import { parseEVChargingStationsAvailabilityResponse } from "./ResponseParser";
import { get } from "../shared/Fetch";
import { evChargingStationsAvailabilityRequestSchema } from "./EVChargingStationsAvailabilityRequestSchema";
import { parseEVChargingStationsAvailabilityResponseError } from "./EVChargingStationsAvailabilityResponseErrorParser";

/**
 * EV Charging Stations Availability service template type.
 * @group EV Charging Stations Availability
 * @category Types
 */
export type EVChargingStationsAvailabilityTemplate = ServiceTemplate<
    EVChargingStationsAvailabilityParams,
    URL,
    EVChargingStationsAvailabilityResponse,
    EVChargingStationsAvailabilityResponse
>;

/**
 * EV Charging Stations Availability service template main implementation.
 * @group EV Charging Stations Availability
 * @category Variables
 */
export const evChargingStationsAvailabilityTemplate: EVChargingStationsAvailabilityTemplate = {
    validateRequestSchema: evChargingStationsAvailabilityRequestSchema,
    buildRequest: buildEVChargingStationsAvailabilityRequest,
    sendRequest: get,
    parseResponse: parseEVChargingStationsAvailabilityResponse,
    parseResponseError: parseEVChargingStationsAvailabilityResponseError
};
