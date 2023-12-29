import { Avoidable, TravelMode, ConnectorType, CurrentType } from "@anw/maps-sdk-js/core";
import { LatitudeLongitudePointAPI } from "../../routing/types/apiResponseTypes";
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
     * Determines if live traffic data should be used to calculate the route.
     * It does not affect the returned traffic information for the calculated route.
     *
     * Possible values:
     * * true (do consider all available traffic information during routing)
     * * false (ignores current traffic data during routing) Note that although the current traffic data is
     * ignored during routing, the effect of historic traffic on effective road speeds is still incorporated.
     * @default true
     */
    considerTraffic?: boolean;

    /**
     * Specifies the type of optimization used when calculating routes.
     *
     * * fastest: Route calculation is optimized by travel time, while keeping the routes sensible.
     * For example, the calculation may avoid shortcuts along inconvenient
     * side roads or long detours that only save very little time.
     * * shortest: Route calculation is optimized by travel distance, while keeping the routes sensible.
     * For example, straight routes are preferred over those incurring turns.
     * * short: Route calculation is optimized such that a good compromise between
     * small travel time and short travel distance is achieved.
     * * eco: Route calculation is optimized such that a good compromise between small travel time
     * and low fuel or energy consumption is achieved.
     * * thrilling: Route calculation is optimized such that routes include interesting or challenging roads
     * and use as few motorways as possible. You can choose the level of turns included and also the degree of hilliness.
     * See "thrillingPreferences" parameters to set this.
     * There is a limit of 900km on routes planned with routeType=thrilling.
     * @default fastest
     */
    routeType?: "fastest" | "shortest" | "short" | "eco" | "thrilling";

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
 * The shape that can be used to avoid a certain area when planning ldEV routes.
 * Object describes an axis-aligned rectangle, defined using the fields southWestCorner and northEastCorner.
 * The maximum size of a rectangle is about 160x160 km.
 * It cannot cross the 180th meridian.
 * It must be between -80 and +80 degrees of latitude.
 */
export type Rectangle = {
    /**
     * The bottom left corner of the rectangle.
     */
    southWestCorner: LatitudeLongitudePointAPI;
    /**
     * The top right corner of the rectangle.
     */
    northEastCorner: LatitudeLongitudePointAPI;
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
 * Must contain one waypointSourceType and one supportingPointIndex object.
 * Can additionally contain one chargingInformationAtWaypoint object.
 */
export type PointWaypoint = {
    /**
     * Denotes the source of the waypoint. Possible values:
     *
     * USER_DEFINED: a waypoint that was explicitly defined by the user.
     * AUTO_GENERATED: a waypoint that was defined by the system (e.g., the charging stop that was provided
     * as a result of the ldEV route enhancement).
     */
    waypointSourceType: "USER_DEFINED" | "AUTO_GENERATED";
    /**
     * An index into the supportingPoints array that denotes the location of the waypoint on the reference route.
     * Must be inside supportingPoints array boundaries.
     */
    supportingPointIndex: number;
    /**
     * Specified if the waypoint is a charging stop.
     */
    chargingInformationAtWaypoint?: ChargingInformationAtWaypoint;
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
