import { ChargingAvailabilityParams } from "./types/ChargingAvailabilityParams";
import { ChargingAvailabilityResponse } from "./types/ChargingAvailabilityResponse";
import { callService } from "../shared/ServiceTemplate";
import { chargingAvailabilityTemplate, ChargingAvailabilityTemplate } from "./ChargingAvailabilityTemplate";

/**
 * The Electric Vehicle (EV) Charging Stations Availability Service provides information about the current availability of charging spots.
 * @group Charging Availability
 * @category Functions
 * @param params Mandatory and optional parameters.
 * @param customTemplate Advanced parameter to plug in how the service treats requests and responses.
 */
export const chargingAvailability = async (
    params: ChargingAvailabilityParams,
    customTemplate?: Partial<ChargingAvailabilityTemplate>
): Promise<ChargingAvailabilityResponse> => {
    return callService(params, { ...chargingAvailabilityTemplate, ...customTemplate }, "ChargingAvailability");
};

export default chargingAvailability;
