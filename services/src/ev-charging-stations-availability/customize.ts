import { buildEVChargingStationsAvailabilityRequest } from "./RequestBuilder";
import { parseEVChargingStationsAvailabilityResponse } from "./ResponseParser";
import { evChargingStationsAvailabilityTemplate } from "./EVChargingStationsAvailabilityTemplate";

const customize = {
    buildEVChargingStationsAvailabilityRequest,
    parseEVChargingStationsAvailabilityResponse,
    evChargingStationsAvailabilityTemplate
};
export default customize;
