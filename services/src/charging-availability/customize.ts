import { buildChargingAvailabilityRequest } from "./RequestBuilder";
import { parseChargingAvailabilityResponse } from "./ResponseParser";
import { chargingAvailabilityTemplate } from "./ChargingAvailabilityTemplate";

const customize = {
    buildChargingAvailabilityRequest,
    parseChargingAvailabilityResponse,
    chargingAvailabilityTemplate
};
export default customize;
