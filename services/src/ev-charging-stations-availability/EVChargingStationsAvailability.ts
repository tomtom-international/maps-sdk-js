import { EVChargingStationsAvailabilityParams } from "./types/EVChargingStationsAvailabilityParams";
import { EVChargingStationsAvailabilityResponse } from "./types/EVChargingStationsAvailabilityResponse";
import { callService } from "../shared/ServiceTemplate";
import {
    evChargingStationsAvailabilityTemplate,
    EVChargingStationsAvailabilityTemplate
} from "./EVChargingStationsAvailabilityTemplate";

/**
 * The Electric Vehicle (EV) Charging Stations Availability Service provides information about the current availability of charging spots.
 * @group EV Charging Stations Availability
 * @category Functions
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 */
export const evChargingStationsAvailability = async (
    params: EVChargingStationsAvailabilityParams,
    customTemplate?: Partial<EVChargingStationsAvailabilityTemplate>
): Promise<EVChargingStationsAvailabilityResponse> => {
    return callService(
        params,
        { ...evChargingStationsAvailabilityTemplate, ...customTemplate },
        "EVChargingStationsAvailability"
    );
};

export default evChargingStationsAvailability;
