import { buildEVChargingStationsAvailabilityRequest } from './requestBuilder';
import { parseEVChargingStationsAvailabilityResponse } from './responseParser';
import { evChargingStationsAvailabilityTemplate } from './evChargingStationsAvailabilityTemplate';

const customize = {
    buildEVChargingStationsAvailabilityRequest,
    parseEVChargingStationsAvailabilityResponse,
    evChargingStationsAvailabilityTemplate,
};
export default customize;
