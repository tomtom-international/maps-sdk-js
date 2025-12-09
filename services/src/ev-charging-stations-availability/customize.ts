import type { EVChargingStationsAvailabilityTemplate } from './evChargingStationsAvailabilityTemplate';
import { evChargingStationsAvailabilityTemplate } from './evChargingStationsAvailabilityTemplate';
import { buildEVChargingStationsAvailabilityRequest } from './requestBuilder';
import { parseEVChargingStationsAvailabilityResponse } from './responseParser';

const customize: {
    buildEVChargingStationsAvailabilityRequest: typeof buildEVChargingStationsAvailabilityRequest;
    parseEVChargingStationsAvailabilityResponse: typeof parseEVChargingStationsAvailabilityResponse;
    evChargingStationsAvailabilityTemplate: EVChargingStationsAvailabilityTemplate;
} = {
    buildEVChargingStationsAvailabilityRequest,
    parseEVChargingStationsAvailabilityResponse,
    evChargingStationsAvailabilityTemplate,
};
export default customize;
