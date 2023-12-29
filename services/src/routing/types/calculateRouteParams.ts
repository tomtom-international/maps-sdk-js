import { GeoInput, inputSectionTypes } from "@anw/maps-sdk-js/core";
import { CommonRoutingParams, CommonServiceParams } from "../../shared";
import { CalculateRouteRequestAPI } from "./apiRequestTypes";
import { CalculateRouteResponseAPI } from "./apiResponseTypes";

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
 * The information about the instructions for Orbis guidance request.
 */
export type GuidanceParams = {
    type: "coded";
    version?: 2;
    phonetics?: "LHP" | "IPA";
    roadShieldReferences?: "all";
};

/**
 * The extended representation of the set of routes provided as a response.
 */
export type ExtendedRouteRepresentation = "distance" | "travelTime";

export type CalculateRouteParams = CommonServiceParams<CalculateRouteRequestAPI, CalculateRouteResponseAPI> &
    CommonRoutingParams & {
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
         * Specifies the extended representation of the set of routes provided as a response. Can be specified multiple times.
         */
        extendedRouteRepresentations?: ExtendedRouteRepresentation[];

        /**
         * If specified, guidance instructions will be returned (if available).
         *
         * If alternative routes are requested, instructions will be generated for each route returned.
         * @default None
         */
        guidance?: GuidanceParams;

        /**
         * The number of desired alternative routes to be calculated.
         *
         * Fewer alternative routes may be returned if either fewer alternatives exist or the requested number of
         * alternatives is larger than the service can calculate.
         * @default 0
         */
        maxAlternatives?: 1 | 2 | 3 | 4 | 5;

        /**
         * Specifies which of the section types is reported in the route response.
         * @default travelMode
         */
        sectionTypes?: InputSectionTypes;

        /**
         * Specifies the precision of coordinates in the response. default: 5 decimals, full: 7 decimals.
         */
        coordinatePrecision?: "default" | "full";
    };
