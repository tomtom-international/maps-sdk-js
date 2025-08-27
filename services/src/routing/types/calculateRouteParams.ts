import type { GeoInput, inputSectionTypes } from '@cet/maps-sdk-js/core';
import type { GetPositionEntryPointOption } from 'core/src/types/lngLat';
import type { CommonRoutingParams, CommonServiceParams } from '../../shared';
import type { CalculateRouteRequestAPI } from './apiRequestTypes';
import type { CalculateRouteResponseAPI } from './apiResponseTypes';

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
    type: 'coded';
    version?: 2;
    phonetics?: 'LHP' | 'IPA';
    roadShieldReferences?: 'all';
};

/**
 * The extended representation of the set of routes provided as a response. Possible values are:
 * * **distance**: Includes distances to route polyline points in the response.
 * * **travelTime**: Includes travel times to route polyline points in the response.
 * @default ["distance", "travelTime"]
 */
export type ExtendedRouteRepresentation = 'distance' | 'travelTime';

/**
 * * none - do not compute additional travel times.
 * * all - compute travel times for all types of traffic information. Specifying all results in the fields
 */
export type ComputeTravelTimeFor = 'none' | 'all';

/**
 * Allowed max number of route alternatives.
 * @default 0
 */
export type MaxNumberOfAlternatives = 0 | 1 | 2 | 3 | 4 | 5;

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
         * Specifies how available entry points are to be used for routing.
         * * Using entry points can help improve route accuracy and prevent unwanted routing to inaccessible locations.
         * * For example, routing to the main entrance of an airport instead of the airport's center location.
         * * Alternatively, wou can also explicitly set the entry points for each waypoint.
         * @default "main-when-available"
         */
        useEntryPoints?: GetPositionEntryPointOption;

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
        computeAdditionalTravelTimeFor?: ComputeTravelTimeFor;

        /**
         * The current heading at the starting point, in degrees starting at true North and continuing in a clockwise direction.
         * * North is 0 degrees.
         * * East is 90 degrees.
         * * South is 180 degrees.
         * * West is 270 degrees.
         *
         * Allowed values: 0-359
         */
        vehicleHeading?: number;

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
        maxAlternatives?: MaxNumberOfAlternatives;

        /**
         * Specifies which of the section types is reported in the route response.
         * * sectionType can be specified multiple times (e.g., ...&sectionType=toll&sectionType=tollVignette&...).
         * * Possible values are:
         *
         * * **carTrain**: sections of the route that are car trains.
         * * **ferry**: sections of the route that are ferries.
         * * **tunnel**: sections of the route that are tunnels.
         * * **motorway**: sections of the route that are motorways.
         * * **pedestrian**: sections of the route that are only suited for pedestrians.
         * * **toll**: sections of the route with the usage-based toll collection system (i.e., distance-based tolls, toll bridges and tunnels, weight-based tolls).
         * * **tollVignette**: sections of the route that require a toll vignette to be present.
         * * **country**: sections indicating which countries the route is in.
         * * **travelMode**: sections in relation to the request parameter travelMode.
         * * **traffic**: sections of the route that contain traffic information.
         * * **carpool**: sections of the route that require use of carpool (HOV/High Occupancy Vehicle) lanes.
         * * **urban**: sections of the route that are located within urban areas.
         * * **unpaved**: sections of the route that are unpaved.
         * * **lowEmissionZone**: sections of the route that are located within low-emission zones.
         * * **roadShields**: Sections with road shield information. A road shield section contains:
         * roadShieldReferences: A list of references for the road shields (roadShieldReference).
         * Notes: If this section type is requested, calculateRouteResponse contains the additional field roadShieldAtlasReference.
         * Please refer to the notes about the road shield atlas for further information.
         * The road shields are only available in these supported countries.
         * * **speedLimit**: Sections with legal speed limit information. maxSpeedLimitInKmh: The maximum legal speed limit in kilometers/hour. This can be time-dependent and/or vehicle-dependent. In the case of a time-dependent speed limit, the section will contain the speed limit effective at the time the planned route would enter this section.
         * @default all
         */
        sectionTypes?: InputSectionTypes;
    };
