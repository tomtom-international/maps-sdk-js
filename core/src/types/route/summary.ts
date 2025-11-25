import { Position } from 'geojson';
import type { ChargingStop } from './chargingStop';

/**
 * Common summary type for a route or route leg.
 * Contains departure/arrival times, lengths and durations.
 * @group Route
 */
export type SummaryBase = {
    /**
     * Estimated arrival time at the end of the route or leg.
     *
     * Calculated from departure time plus travel time, accounting for traffic conditions.
     */
    arrivalTime: Date;
    /**
     * Departure time from the beginning of the route or leg.
     *
     * Based on the departure time specified in the routing request.
     */
    departureTime: Date;
    /**
     * Total length of the route or leg in meters.
     */
    lengthInMeters: number;
    /**
     * Estimated travel time in seconds for the route or leg.
     *
     * @remarks
     * This value includes delays due to real-time traffic, even when considerTraffic=false.
     * Use noTrafficTravelTimeInSeconds for free-flow travel time without traffic delays.
     */
    travelTimeInSeconds: number;
    /**
     * Additional delay in seconds caused by current traffic conditions.
     *
     * Represents the extra time compared to free-flow conditions.
     * A value of 0 means no traffic delays.
     */
    trafficDelayInSeconds: number;
    /**
     * Length in meters of the route affected by traffic events causing delays.
     *
     * Indicates the portion of the route experiencing congestion or incidents.
     */
    trafficLengthInMeters: number;
    /**
     * Estimated travel time in seconds assuming free-flow conditions.
     *
     * Calculated as if there were no traffic delays (no congestion).
     * Only included if requested using the computeTravelTimeFor parameter.
     */
    noTrafficTravelTimeInSeconds?: number;
    /**
     * Estimated travel time in seconds using time-dependent historic traffic data.
     *
     * Represents the expected travel time based on typical traffic patterns
     * for the requested departure time (e.g., rush hour vs off-peak).
     * Only included if requested using the computeTravelTimeFor parameter.
     */
    historicTrafficTravelTimeInSeconds?: number;
    /**
     * Estimated travel time in seconds using real-time traffic speed data.
     *
     * Based on current live traffic conditions and incidents.
     * Only included if requested using the computeTravelTimeFor parameter.
     */
    liveTrafficIncidentsTravelTimeInSeconds?: number;
    /**
     * The distance (in meters) from the origin point to the first point where this route forks off from the reference route.
     *
     * @remarks
     * * If the route is identical to the reference route, then this field is set to the length of the route.
     * * Included in all alternative (but not reference) route summary fields.
     */
    deviationDistanceInMeters?: number;
    /**
     * The travel time (in seconds) from the origin point to the first point where this route forks off from the reference route.
     *
     * @remarks
     * * If the route is identical to the reference route, then this field is set to the estimated travel time of the route.
     * * Included in all alternative (but not reference) route summary fields.
     */
    deviationTimeInSeconds?: number;
    /**
     * The coordinates of the first point where this route forks off from the reference route.
     *
     * @remarks
     * * If the route is identical to the reference route, then this field is set to the coordinates of the last point on the route.
     * * Included in all alternative (but not reference) route summary fields.
     */
    deviationPoint?: Position;
};

/**
 * Summary information for routes using combustion engine vehicles.
 *
 * Extends the base summary with fuel consumption estimates.
 *
 * @group Route
 */
export type CombustionSummary = SummaryBase & {
    /**
     * Estimated fuel consumption in liters for the route or leg.
     *
     * Calculated using the Combustion Consumption Model based on:
     * - Vehicle speed-to-consumption rates
     * - Route characteristics (elevation, road types)
     * - Driving conditions
     *
     * @remarks
     * Included only if:
     * - Vehicle engine type is set to combustion
     * - Speed-to-consumption rates are specified in the request
     *
     * The value is always positive (no fuel recuperation).
     *
     * @example
     * ```typescript
     * // A 100km route might consume
     * fuelConsumptionInLiters: 7.5  // 7.5 liters
     * ```
     */
    fuelConsumptionInLiters?: number;
};

/**
 * Summary information for routes using electric vehicles.
 *
 * Extends the base summary with battery consumption and charge level estimates.
 *
 * @group Route
 */
export type ElectricSummary = SummaryBase & {
    /**
     * Estimated electric energy consumption in kilowatt-hours (kWh).
     *
     * Calculated using the Electric Consumption Model based on:
     * - Vehicle speed-to-consumption rates
     * - Route characteristics (elevation changes)
     * - Recuperation (regenerative braking)
     *
     * @remarks
     * Included only if:
     * - Vehicle engine type is set to electric
     * - Speed-to-consumption rates are specified in the request
     *
     * This value includes recuperated energy and can be negative (indicating net energy gain),
     * such as when descending a long hill. If maxChargeInkWh is specified, recuperation is
     * capped to prevent exceeding maximum battery capacity.
     *
     * @example
     * ```typescript
     * batteryConsumptionInkWh: 15.5    // Consumed 15.5 kWh
     * batteryConsumptionInkWh: -2.3    // Gained 2.3 kWh (downhill with recuperation)
     * ```
     */
    batteryConsumptionInkWh?: number;

    /**
     * Estimated battery consumption as a percentage of maximum capacity.
     *
     * Only present if maxChargeInkWh was specified in the request and
     * batteryConsumptionInkWh is available.
     *
     * @example
     * ```typescript
     * // If maxChargeInkWh is 100 and batteryConsumptionInkWh is 15.5
     * batteryConsumptionInPCT: 15.5  // 15.5% of battery capacity
     * ```
     */
    batteryConsumptionInPCT?: number;

    /**
     * Estimated battery charge in kWh upon arrival at the destination.
     *
     * Available only for Long Distance EV Routing (LDEVR) with charging stops.
     * Calculated as: currentChargeInkWh - batteryConsumptionInkWh + chargingEnergy
     */
    remainingChargeAtArrivalInkWh?: number;
    /**
     * Estimated battery charge as percentage of capacity upon arrival.
     *
     * Available only for Long Distance EV Routing (LDEVR) with charging stops.
     * Derived from remainingChargeAtArrivalInkWh and maxChargeInkWh.
     */
    remainingChargeAtArrivalInPCT?: number;
};

/**
 * Combined summary supporting both combustion and electric vehicle metrics.
 *
 * @group Route
 */
export type SummaryWithConsumption = CombustionSummary & ElectricSummary;

/**
 * Complete summary information for an entire route.
 *
 * Includes all journey statistics from origin to destination, including
 * any intermediate charging stops for electric vehicles.
 *
 * @group Route
 */
export type RouteSummary = SummaryWithConsumption & {
    /**
     * Total time in seconds spent at all charging stops during the route.
     *
     * @remarks
     * - Only present for electric vehicle routes with charging stops (LDEVR)
     * - The route's travelTimeInSeconds includes this charging time
     * - To get driving time only: travelTimeInSeconds - totalChargingTimeInSeconds
     *
     * @example
     * ```typescript
     * // Route with 2 charging stops of 20 and 25 minutes
     * totalChargingTimeInSeconds: 2700  // 45 minutes total
     * ```
     */
    totalChargingTimeInSeconds?: number;
};

/**
 * Summary information for a single route leg.
 *
 * A leg is the portion of the route between two consecutive waypoints.
 *
 * @remarks
 * - An A→B route has 1 leg
 * - An A→B→C route has 2 legs (A→B, B→C)
 * - Circle waypoints don't create new legs
 *
 * @group Route
 */
export type LegSummary = SummaryWithConsumption & {
    /**
     * Charging information at the end of this leg.
     *
     * Present only if this leg ends at a charging stop, indicating the vehicle
     * will charge at this waypoint before continuing to the next leg.
     *
     * @remarks
     * Contains details about:
     * - Charging park location and facilities
     * - Required charging time
     * - Target charge level after charging
     *
     * @example
     * ```typescript
     * chargingInformationAtEndOfLeg: {
     *   chargingParkId: 'park-123',
     *   chargingTimeInSeconds: 1200,  // 20 minutes
     *   targetChargeInkWh: 80,
     *   targetChargeInPCT: 80
     * }
     * ```
     */
    chargingInformationAtEndOfLeg?: ChargingStop;
};
