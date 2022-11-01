import { ServiceTemplate } from "../shared/ServiceTypes";
import { ChargingAvailabilityParams } from "./types/ChargingAvailabilityParams";
import { ChargingAvailabilityResponse } from "./types/ChargingAvailabilityResponse";
import { buildChargingAvailabilityRequest } from "./RequestBuilder";
import { parseChargingAvailabilityResponse } from "./ResponseParser";
import { getJson } from "../shared/Fetch";
import { chargingAvailabilityRequestSchema } from "./ChargingAvailabilityRequestSchema";
import { chargingAvailabilityResponseErrorParser } from "./ChargingAvailabilityResponseErrorParser";

/**
 * Charging Availability service template type.
 * @group ChargingAvailability
 * @category Types
 */
export type ChargingAvailabilityTemplate = ServiceTemplate<
    ChargingAvailabilityParams,
    URL,
    ChargingAvailabilityResponse,
    ChargingAvailabilityResponse
>;

/**
 * Charging Availability service template main implementation.
 * @group ChargingAvailability
 * @category Variables
 */
export const chargingAvailabilityTemplate: ChargingAvailabilityTemplate = {
    validateRequestSchema: chargingAvailabilityRequestSchema,
    buildRequest: buildChargingAvailabilityRequest,
    sendRequest: getJson,
    parseResponse: parseChargingAvailabilityResponse,
    parseResponseError: chargingAvailabilityResponseErrorParser
};
