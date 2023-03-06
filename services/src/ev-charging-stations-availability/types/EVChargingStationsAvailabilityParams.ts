import { CommonServiceParams } from "../../shared";
import { ConnectorType } from "@anw/go-sdk-js/core";

export type EVChargingStationsAvailabilityParams = CommonServiceParams & {
    /**
     * The chargingAvailability ID, previously retrieved from a Search request.
     */
    id: string;

    /**
     * The list of connector types which could be used to restrict the result to the availability for the specific connector types. (the same as in search request)
     * When multiple connector types are provided, only connectors that support (at least) one of the connector types from the provided list will be returned.
     */
    connectorTypes?: ConnectorType[];

    /**
     * Minimal value of power in kW (the same as in search request)
     */
    minPowerKW?: number;

    /**
     * Maximum value of power in kW (the same as in search request)
     */
    maxPowerKW?: number;
};
