import { BatteryCharging } from "./BatteryCharging";

/**
 * Common summary type for a route or route leg.
 * Contains departure/arrival times, lengths and durations.
 * @group Route
 * @category Types
 */
export type SummaryBase = {
    /**
     * The arrival time at the end of the route or leg.
     */
    arrivalTime: Date;
    /**
     * The departure time from the beginning of the route or leg.
     */
    departureTime: Date;
    /**
     * The length of the route or leg in meters.
     */
    lengthInMeters: number;
    /**
     * The estimated travel time in seconds for the route or leg.
     * Note that even when considerTraffic=false, travelTimeInSeconds still includes the delay due to traffic.
     */
    travelTimeInSeconds: number;
    /**
     * The delay in seconds compared to free-flow conditions according to real-time traffic information.
     */
    trafficDelayInSeconds: number;
    /**
     * The portion of the route or leg, expressed in meters, that is affected by traffic events which cause the delay.
     */
    trafficLengthInMeters: number;
    /**
     * The estimated travel time in seconds
     * calculated as if there are no delays on the route due to traffic conditions (e.g., congestion).
     * Included if requested using the computeTravelTimeFor parameter.
     */
    noTrafficTravelTimeInSeconds?: number;
    /**
     * The estimated travel time in seconds calculated using time-dependent historic traffic data.
     * In other words, the expected travel time considering the predicted traffic at the requested time.
     * Included if requested using the computeTravelTimeFor parameter.
     */
    historicTrafficTravelTimeInSeconds?: number;
    /**
     * The estimated travel time in seconds calculated using real-time speed data.
     * Included if requested using the computeTravelTimeFor parameter.
     */
    liveTrafficIncidentsTravelTimeInSeconds?: number;
};

/**
 * @group Route
 * @category Types
 */
export type CombustionSummary = SummaryBase & {
    /**
     * The estimated fuel consumption in liters using the Combustion Consumption Model.
     *
     * Included if:
     * * The vehicle engine type is set to combustion.
     * * The speed to consumption rates are specified.
     *
     * The value will be positive.
     */
    fuelConsumptionInLiters?: number;
};

/**
 * @group Route
 * @category Types
 */
export type ElectricSummary = SummaryBase & {
    /**
     * The estimated electric energy consumption in kilowatt-hours (kWh) using the Electric Consumption Model.
     *
     * Included if:
     * * The vehicle engine type is set to electric.
     * * The speed to consumption rates are specified.
     *
     * * The value of batteryConsumptionInkWh includes the recuperated electric energy and can therefore be negative
     * (which indicates gaining energy).
     * * If both maxChargeInkWh and currentChargeInkWh are specified, recuperation will be capped to ensure that
     * the battery charge level never exceeds maxChargeInkWh.
     * * If neither maxChargeInkWh nor currentChargeInkWh are specified,
     * unconstrained recuperation is assumed in the consumption calculation.
     */
    batteryConsumptionInkWh?: number;

    /**
     * The estimated electric energy consumption in battery %.
     * * Present only if maxChargeInkWh was set in request and batteryConsumptionInkWh is available in summary.
     */
    batteryConsumptionInPCT?: number;

    /**
     * LDEVR (Long Distance EV Routing) - only
     * The estimated battery charge in kWh upon arrival at the end of the leg or the route.
     */
    remainingChargeAtArrivalInkWh?: number;
    /**
     * LDEVR (Long Distance EV Routing) - only
     * The estimated battery charge in % upon arrival at the end of the leg or the route.
     */
    remainingChargeAtArrivalInPCT?: number;
};

/**
 * @group Route
 * @category Types
 */
export type SummaryWithConsumption = CombustionSummary & ElectricSummary;

/**
 * Summary for the whole route.
 * @group Route
 * @category Types
 */
export type RouteSummary = SummaryWithConsumption & {
    /**
     * The estimated time spent at all charging stops in the route.
     * * The travelTimeInSeconds of the route includes the totalChargingTimeInSeconds value.
     */
    totalChargingTimeInSeconds?: number;
};

/**
 * Summary for a route leg.
 * @group Route
 * @category Types
 */
export type LegSummary = SummaryWithConsumption & {
    /**
     * Charging information at the end of a leg.
     * * It is contained in the leg summary if and only if the leg ends at a charging stop.
     */
    chargingInformationAtEndOfLeg?: BatteryCharging;
};
