import { evChargingStationsAvailabilityTemplate } from './evChargingStationsAvailabilityTemplate';
import { buildEVChargingStationsAvailabilityRequest } from './requestBuilder';
import { parseEVChargingStationsAvailabilityResponse } from './responseParser';

const customize = {
    buildEVChargingStationsAvailabilityRequest,
    parseEVChargingStationsAvailabilityResponse,
    evChargingStationsAvailabilityTemplate,
};
export default customize;
