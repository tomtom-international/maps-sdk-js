import type { Avoidable, ConnectorType, CurrentType, TravelMode } from "@anw/maps-sdk-js/core";
// import { VehicleParameters } from "./vehicleParams";

/**
 * Basic low/normal/high option.
 */
export type LNH = "low" | "normal" | "high";

/**
 * Options applicable to the thrilling route type.
 */
export type ThrillingParams = {
    /**
     * The level of hilliness on a thrilling route.
     * * Possible values: low, normal, high.
     * * This parameter can only be used in conjunction with routeType thrilling.
     * @default None
     */
    hilliness?: LNH;

    /**
     * The level of windingness on a thrilling route.
     *
     * * Possible values: low, normal, high.
     * * This parameter can only be used in conjunction with routeType thrilling.
     * @default None
     */
    windingness?: LNH;
};

export const routeTypes = ["fast", "short", "efficient", "thrilling"] as const;

/**
 * Decides how traffic is considered for computing routes.
 * Possible values are:
 * * live: In addition to historical travel times, routing and estimated travel time
 * consider traffic jams and short- and long-term closures during the travel time window.
 * * historical: Routing and estimated travel time consider historical travel times and long term closures.
 * Traffic jams and short-term closures during the travel time window do not influence routing or travel time.
 */
export type TrafficInput = "live" | "historical";

/**
 * Criteria that specifies what paths to prefer during routing.
 */
export type CostModel = {
    /**
     * Specifies something that the route calculation should try to avoid when determining the route.
     * @default None
     */
    avoid?: Avoidable[];

    /**
     * Decides how traffic is considered for computing routes.
     * Possible values are:
     * * live: In addition to historical travel times, routing and estimated travel time
     * consider traffic jams and short- and long-term closures during the travel time window.
     * * historical: Routing and estimated travel time consider historical travel times and long term closures.
     * Traffic jams and short-term closures during the travel time window do not influence routing or travel time.
     * @default live
     */
    traffic?: TrafficInput;

    /**
     * Specifies the type of optimization used when calculating routes.
     * Possible values are:
     *
     * * **fast**: Route calculation is optimized by travel time, while keeping the routes sensible. For example, the calculation may avoid shortcuts along inconvenient side roads or long detours that only save very little time.
     * * **short**: Route calculation is optimized such that a good compromise between small travel time and short travel distance is achieved.
     * * **efficient**: Route calculation is optimized such that a good compromise between small travel time and low fuel or energy consumption is achieved.
     * * **thrilling**: Route calculation is optimized such that routes include interesting or challenging roads and use as few motorways as possible.
     * There is a limit of 900km on routes planned with routeType=thrilling.
     * @default fast
     */
    routeType?: (typeof routeTypes)[number];

    /**
     * Optional parameters if the route type is "thrilling" to indicate how curvy and hilly the route should be.
     */
    // TODO no longer supported
    // thrillingParams?: ThrillingParams;
};

type DepartArriveOption = "departAt" | "arriveBy";

/**
 * Specifies when to depart (start traveling) or to arrive (finish traveling).
 */
export type DepartArriveParams<OPTION extends DepartArriveOption = DepartArriveOption> = {
    /**
     * Whether to specify a departure or arrive time (when allowed).
     */
    option: OPTION;
    /**
     * The date and time to depart or arrive.
     */
    date: Date;
};

/**
 * Information about charging connection.
 */
export type ChargingConnectionInfo = {
    /**
     * The type of charging plug.
     */
    chargingPlugType: ConnectorType;
    /**
     * The type of charging current.
     */
    chargingCurrentType?: CurrentType;
    /**
     * The rated power in kilowatts.
     */
    chargingPowerInkW?: number;
    /**
     * The rated voltage in volts.
     */
    chargingVoltageInV?: number;
    /**
     * The rated current in amps.
     */
    chargingCurrentInA?: number;
};

/**
 * Must contain the fields:
 * chargingConnectionInfo, chargingParkUuid, chargingTimeInSeconds, and targetChargeInkWh.
 *
 * chargingConnectionInfo must contain chargingPlugType and may contain
 * chargingCurrentType, chargingPowerInkW ,chargingVoltageInV, and chargingCurrentInA
 */
export type ChargingInformationAtWaypoint = {
    /**
     * Information about the charging connection.
     */
    chargingConnectionInfo: ChargingConnectionInfo;
    /**
     * The unique identifier of this charging park.
     * * This uuid can be used to check the availability of the charging park.
     */
    chargingParkUuid: string;
    /**
     * The charge in kWH to which the battery should be charged.
     */
    targetChargeInkWh: number;

    /**
     * The estimated time in seconds spent at the charging stop,
     * allowing for some additional time needed to use the charging facility.
     */
    chargingTimeInSeconds: number;
};

/**
 * EV Routing Parameters.
 */
export type CommonEVRoutingParams = {
    /**
     * Specifies the current electric energy supply in kilowatt hours (kWh).
     * Minimum value: 0.0. Maximum value: vehicle's battery capacity defined by given vehicleModelId.
     */
    currentChargeInkWh: number;
    /**
     * The battery level upon arrival at the destination of the resulting route will be at least this much.
     * Maximum value: vehicle's battery capacity defined by given vehicleModelId.
     */
    minChargeAtDestinationInkWh: number;
    /**
     * The desired minimum battery charge level upon arrival at each charging station.
     * However, the remaining charge at the first charging stop may be lower.
     * Maximum value: 0.5 × vehicle's battery capacity defined by given vehicleModelId.
     */
    minChargeAtChargingStopsInkWh: number;
    /**
     * Identifier of the vehicle model which should be used for routing.
     */
    vehicleModelId: string;
};

/**
 * @see https://developer.tomtom.com/routing-api/documentation/routing/common-routing-parameters
 */
export type CommonRoutingParams = {
    /**
     * Criteria that specifies what paths to prefer during routing.
     */
    costModel?: CostModel;

    /**
     * The primary means of transportation to be used while routing.
     *
     * The travel mode for the requested route.
     * Note that the requested travelMode may not be available for the entire route. Where
     * the requested travelMode is not available for a particular section, the element of the
     * response for that section will be 'other'.
     * @default None
     */
    travelMode?: TravelMode;

    /**
     * Specifies when to depart or arrive.
     * If past dates are supplied or in a way that are impossible to achieve
     * (e.g. an imminent arrival date for a long route), then it will default to departing now.
     * @default depart now
     */
    // TODO no longer supported
    // when?: DepartArriveParams;

    /**
     * TODO: refactor vehicle parameters in the future
     * Specifies the vehicle parameters to be used for the ldEV route calculation.
     */
    commonEVRoutingParams?: CommonEVRoutingParams;

    /**
     * The version of the API to use.
     * * The SDK will use the right default when not specified.
     * * Use it only if you really need to target a specific API version.
     */
    apiVersion?: number;
};
