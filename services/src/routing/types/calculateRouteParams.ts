import { Avoidable, GeoInput, inputSectionTypes, TravelMode } from "@anw/maps-sdk-js/core";
import { CommonServiceParams } from "../../shared";
import { VehicleParameters } from "./vehicleParams";

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
    thrillingParams?: ThrillingParams;
};

/**
 * Specifies when to depart (start traveling) or to arrive (finish traveling).
 */
export type DepartArriveParams = { option: "departAt" | "arriveBy"; date: Date };

/**
 * Section type which can be requested in the route parameters.
 * * (Other section types such as "leg" might be automatically calculated regardless of these inputs).
 */
export type InputSectionType = (typeof inputSectionTypes)[number];

/**
 * Possible input section types that can be requested to the routing API.
 * * These exclude sections that will be returned no matter what (e.g. leg).
 *
 * Possible values:
 * * all: all section types are to be included in the response
 * * carTrain, ferry, tunnel or motorway: get sections if the route includes car trains, ferries, tunnels, or motorways.
 * * pedestrian: sections which are only suited for pedestrians.
 * * tollRoad: sections which require a toll to be paid.
 * * tollVignette: sections which require a toll vignette to be present.
 * * country: countries the route has parts in.
 * * travelMode: sections in relation to the request parameter 'travelMode'.
 * @default All of them (If you want none, pass an empty array).
 */
export type InputSectionTypes = InputSectionType[];

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

export const instructionsTypes = ["coded", "text", "tagged"] as const;

/**
 * Basic coded/text/tagged values.
 */
export type InstructionsTypes = (typeof instructionsTypes)[number];

export type CalculateRouteParams = CommonServiceParams & {
    /**
     * These are the specified locations (waypoints) and/or path points (supporting points) for route calculation.
     * They are to be supplied in the order the route should go through.
     * * They are mandatory.
     * * If only supplying waypoints, at least 2 must be specified, corresponding to the route origin and destination.
     * * If using path points, at least 1 path must be specified with at least 2 points inside for origin and destination.
     * * Waypoints and path points can be combined, except circle (soft) waypoints.
     * @see For path points in the API: {@link https://developer.tomtom.com/routing-api/documentation/routing/calculate-route#post-data-parameters POST data parameters}
     * @default None
     */
    geoInputs: GeoInput[];

    /**
     * Criteria that specifies what paths to prefer during routing.
     */
    costModel?: CostModel;

    /**
     * Specifies whether to return additional travel times using different types of traffic information (none,
     * historic, live) as well as the default best-estimate travel time.
     *
     * * Possible values:
     * * none - do not compute additional travel times.
     * * all - compute travel times for all types of traffic information. Specifying all results in the fields
     * noTrafficTravelTimeInSeconds, historicTrafficTravelTimeInSeconds and
     * liveTrafficIncidentsTravelTimeInSeconds being included in the summaries in the route response.
     * @default None
     */
    computeAdditionalTravelTimeFor?: "none" | "all";

    /**
     * The current heading at the starting point, in degrees starting at true North and continuing in a clockwise direction.
     * * North is 0 degrees.
     * * East is 90 degrees.
     * * South is 180 degrees.
     * * West is 270 degrees.
     *
     * Allowed values: 0-359
     */
    currentHeading?: number;

    /**
     * If specified, guidance instructions will be returned (if available).
     *
     * Possible values:
     * * coded : returns raw instruction data without human-readable messages.
     * * text : returns raw instructions data with human-readable messages in plain text.
     * * tagged : returns raw instruction data with tagged human-readable messages to permit formatting.
     *
     * If alternative routes are requested, instructions will be generated for each route returned.
     * @default None
     */
    instructionsType?: InstructionsTypes;

    /**
     * The number of desired alternative routes to be calculated.
     *
     * Fewer alternative routes may be returned if either fewer alternatives exist or the requested number of
     * alternatives is larger than the service can calculate.
     * @default 0
     */
    maxAlternatives?: 1 | 2 | 3 | 4 | 5;

    /**
     * Specifies the representation of the set of routes provided as a response.
     *
     * Possible values are:
     * * polyline: includes routes in the response.
     * * summaryOnly: as per polyline, but excluding the points elements for the routes in the response.
     * @default polyline
     */
    routeRepresentation?: "polyline" | "summaryOnly";

    /**
     * Specifies which of the section types is reported in the route response.
     * @default travelMode
     */
    sectionTypes?: InputSectionTypes;

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
     * Parameters for the vehicle that will be used to drive the route.
     */
    vehicle?: VehicleParameters;

    /**
     * Specifies when to depart or arrive.
     * If past dates are supplied or in a way that are impossible to achieve
     * (e.g. an imminent arrival date for a long route), then it will default to departing now.
     * @default depart now
     */
    when?: DepartArriveParams;
};
