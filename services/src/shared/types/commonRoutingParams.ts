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
     * This parameter has been deprecated. It may be removed in the future.
     * The only allowed value for calculateLongDistanceEVRoute: electric
     * @deprecated
     */
    vehicleEngineType: "electric";
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
    /**
     * All alternative routes returned will follow the reference route (see the POST data parameters section)
     * from the origin point of the calculateLongDistanceEVRoute request for at least this number of meters.
     * Can only be used for a route update request.
     * Default value:0
     */
    minDeviationDistance?: number;
    /**
     * All alternative routes returned will follow the reference route (see the POST data parameters section)
     * from the origin point of the calculateLongDistanceEVRoute request for at least this number of seconds.
     * Can only be used for a route update request.
     * Default value:0
     */
    minDeviationTime?: number;
    /**
     * Largest index in the supportingPoints array (see the POST data parameters section) for which
     * supportingPoints[supportingPointIndexOfOrigin] lies on or before the origin point.
     * The Routing API uses this index as a hint to disambiguate situations where the supportingPoints in the POST data
     * are not planar, or where they come back close to the origin at a later point in the reconstructed route.
     * In these cases, the supportingPointIndexOfOrigin can explicitly identify if the origin is meant to be on the
     * later part of the route, or not.
     *
     * Can only be used for a route update request.
     * Minimum value: 0. Maximum value: Size of supportingPoints array - 1.
     */
    //TODO check if this is supported in POST calculate route request, not just for EV
    supportingPointIndexOfOrigin?: number;
    /**
     * When maxAlternatives is greater than 0, allows to specify the objective of computing alternative routes:
     * finding routes that are significantly different than the reference route, or finding routes that are better
     * than the reference route. Possible values are:
     * anyRoute: returns alternative routes that are significantly different from the reference route.
     * betterRoute: only returns alternative routes that have smaller travel time. If there is a road block on the
     * reference route, then any alternative that does not contain any blockages will be considered a better route.
     * The summary in the route response will contain information (see the planningReason parameter) about the reason
     * for the better alternative.
     * Note: This optional parameter can only be used for a route update request.
     * Default value: anyRoute Other values: betterRoute
     */
    alternativeType?: "anyRoute" | "betterRoute";

    /**
     * Some parameters can be provided using the HTTP POST method.
     *
     * The POST data should be in JSON format, see the Content-Type header.
     * All POST data parameters are optional.
     * It is an error to use the HTTP POST method if no POST data parameters are provided.
     * There is an upper limit on the total size of the POST data.
     *
     * Exceeding this limit results in a response with the response code 413, indicating invalid POST data.
     * The client must not rely on the exact value of this limit.
     * The current limit is 10 MB.
     * The POST data body can only contain avoidAreas JSON array, supportingPoints JSON array or pointWaypoints
     * JSON array. The following table describes these parameters.
     */
    postData?: {
        /**
         * This is an array of shapes to avoid for planning routes. Supported shapes include rectangles.
         * It can contain one of each supported shapes fields.
         */
        avoidAreas?: [Rectangle[]];
        /**
         * Locations to be used as input for route reconstruction.
         *
         * Can only be used for a route update request.
         */
        supportingPoints?: LatitudeLongitudePointAPI[];
        /**
         * An array of pointWaypoint objects, to be used to represent waypoints when reconstructing a route.
         *
         * If specified, the array must not be empty.
         * Can only be used for a route update request.
         */
        pointWaypoints?: PointWaypoint[];
    };
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
     * Specifies the vehicle parameters to be used for the ldEV route calculation.
     */
    commonEVRoutingParams?: CommonEVRoutingParams;

    /**
     * The version of the API to use. It defaults to 1 if not specified.
     */
    apiVersion?: number;
};
