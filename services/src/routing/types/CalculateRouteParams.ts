import { Avoidable, HasLngLat, inputSectionTypes, TravelMode, Waypoint } from "@anw/go-sdk-js/core";
import { CommonServiceParams } from "../../shared/ServiceTypes";

/**
 * Section type which can be requested in the route parameters.
 * * (Other section types such as "leg" might be automatically calculated regardless of these inputs).
 */
export type InputSectionType = typeof inputSectionTypes[number];

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
 * A waypoint input is either a complex waypoint object or anything with coordinates.
 * * By default, waypoints are considered as single points,
 * unless a radius is specified, which then transforms the waypoint into a circle(soft waypoint).
 */
export type WaypointInput = Waypoint | HasLngLat;

/**
 * List of waypoint inputs, including origin and destination at the edges.
 * * They must at least contain origin and destination, with any further waypoints ordered in between them.
 * * Origin and destination must be default waypoints without radius (point type, not circle).
 * * All the locations in the array are to be traversed in sequence (e.g. [origin, waypoint1, waypoint2, destination])
 */
export type WaypointInputs = [WaypointInput, WaypointInput, ...WaypointInput[]];

export type RouteMandatoryParams = {
    /**
     * These are the specified locations for route calculation. They are the main input and are mandatory.
     * @default None
     */
    locations: WaypointInputs;
};

export type RouteOptionalParams = {
    /**
     * Specifies something that the route calculation should try to avoid when determining the route.
     * @default None
     */
    avoid?: Avoidable[];

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
    instructionsType?: "coded" | "text" | "tagged";

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
     * Specifies which of the section types is reported in the route response.
     *
     * Possible values:
     * carTrain, ferry, tunnel or motorway: get
     * sections if the route includes car trains, ferries, tunnels, or motorways.
     * pedestrian: sections which are only suited for pedestrians.
     * tollRoad: sections which require a toll to be payed.
     * tollVignette: sections which require a toll vignette to be present.
     * country: countries the route has parts in.
     * travelMode: sections in relation to the request parameter 'travelMode'.
     * The default value is travelMode.
     * @default travelMode
     */
    sectionTypes?: "all" | InputSectionType[];

    /**
     * Optional parameters if the route type is "thrilling" to indicate how curvy and hilly the route should be.
     */
    thrillingParams?: ThrillingParams;

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
    when?: { option: "departAt" | "arriveBy"; date: Date };
};

export type CalculateRouteParams = CommonServiceParams & RouteMandatoryParams & RouteOptionalParams;
