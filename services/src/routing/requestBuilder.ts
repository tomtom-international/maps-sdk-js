import {
    GeoInput,
    GeoInputType,
    getGeoInputType,
    getLngLatArray,
    inputSectionTypes,
    inputSectionTypesWithGuidance,
    PathLike,
    Waypoint,
    WaypointLike,
    WaypointProps
} from "@anw/maps-sdk-js/core";
import isNil from "lodash/isNil";
import { Position } from "geojson";
import { CalculateRouteParams, InputSectionTypes, GuidanceParams } from "./types/calculateRouteParams";
import { appendByRepeatingParamName, appendCommonParams, appendOptionalParam } from "../shared/requestBuildingUtils";
import { FetchInput } from "../shared/types/fetch";
import { CalculateRoutePOSTDataAPI, PointWaypointAPI } from "./types/apiRequestTypes";
import { LatitudeLongitudePointAPI } from "./types/apiResponseTypes";
import { positionToCSVLatLon } from "../shared/geometry";
import { appendCommonRoutingParams } from "../shared/commonRoutingRequestBuilder";
// import { CommonEVRoutingParams } from "../shared";

// Are these params about Long Distance EV Routing:
const isLDEVR = (params: CalculateRouteParams): boolean => !!params.commonEVRoutingParams;

const buildURLBasePath = (params: CalculateRouteParams): string =>
    params.customServiceBaseURL ||
    `${params.commonBaseURL}/maps/orbis/routing/${isLDEVR(params) ? "calculateLongDistanceEVRoute" : "calculateRoute"}`;

const getWaypointProps = (waypointInput: WaypointLike): WaypointProps | null =>
    (waypointInput as Waypoint).properties || null;

const buildLocationsStringFromWaypoints = (waypointInputs: WaypointLike[]): string =>
    waypointInputs
        .map((waypointInput: WaypointLike) => {
            const lngLatString = positionToCSVLatLon(getLngLatArray(waypointInput));
            const radius = getWaypointProps(waypointInput)?.radiusMeters;
            return radius ? `circle(${lngLatString},${radius})` : lngLatString;
        })
        .join(":");

export const getPositionsFromPath = (pathLike: PathLike): Position[] => {
    if (Array.isArray(pathLike)) {
        return pathLike;
    } else {
        return pathLike.geometry.coordinates;
    }
};

const getFirstAndLastPoints = (geoInputs: GeoInput[], types: GeoInputType[]): [Position, Position] => {
    let firstPoint;
    const firstGeoInput = geoInputs[0];
    if (types[0] === "path") {
        const positions = getPositionsFromPath(firstGeoInput as PathLike);
        firstPoint = positions[0];
    } else {
        firstPoint = getLngLatArray(firstGeoInput as WaypointLike);
    }

    let lastPoint;
    const lastGeoInput = geoInputs[geoInputs.length - 1];
    if (types[types.length - 1] === "path") {
        const positions = getPositionsFromPath(lastGeoInput as PathLike);
        lastPoint = positions[positions.length - 1];
    } else {
        lastPoint = getLngLatArray(lastGeoInput as WaypointLike);
    }

    return [firstPoint, lastPoint];
};

const buildLocationsString = (geoInputs: GeoInput[], geoInputTypes: GeoInputType[]): string =>
    buildLocationsStringFromWaypoints(
        geoInputTypes.includes("path") ? getFirstAndLastPoints(geoInputs, geoInputTypes) : (geoInputs as WaypointLike[])
    );

const appendSectionTypes = (
    urlParams: URLSearchParams,
    sectionTypes: InputSectionTypes | undefined,
    instructionsInclude: boolean
): void => {
    const effectiveSectionTypes = (
        sectionTypes || (instructionsInclude ? inputSectionTypesWithGuidance : inputSectionTypes)
    ).map((sectionType) => (sectionType === "vehicleRestricted" ? "travelMode" : sectionType));
    appendByRepeatingParamName(urlParams, "sectionType", effectiveSectionTypes);
};

const appendGuidanceParams = (urlParams: URLSearchParams, params?: CalculateRouteParams): void => {
    if (params?.guidance) {
        const guidance: GuidanceParams = params.guidance;
        urlParams.append("instructionsType", guidance.type);
        urlParams.append("guidanceVersion", String(guidance.version || 2));
        urlParams.append("instructionPhonetics", guidance.phonetics || "IPA");
        urlParams.append("instructionRoadShieldReferences", guidance.roadShieldReferences || "all");
        urlParams.append("language", params.language || "en-US");
    }
};

const toLatLngPointAPI = (position: Position): LatitudeLongitudePointAPI => ({
    latitude: position[1],
    longitude: position[0]
});

// appends a path into the given post data, adding to supportingPoints and pointWaypoints as applicable
const appendPathPOSTData = (
    pathGeoInput: PathLike,
    geoInputIndex: number,
    geoInputs: GeoInput[],
    supportingPoints: LatitudeLongitudePointAPI[],
    pointWaypoints: PointWaypointAPI[]
): void => {
    // first, we add the supportingPoints from the path coordinates:
    const supportingPointsLengthBeforePath = supportingPoints.length;
    for (const position of getPositionsFromPath(pathGeoInput)) {
        supportingPoints.push(toLatLngPointAPI(position));
    }
    // then we check if it's a route, and if so we add waypoints from its legs as applicable
    // (a route leg is the portion of the path between 2 waypoints)
    if (!Array.isArray(pathGeoInput)) {
        const legs = pathGeoInput.properties.sections.leg;
        // (We assume all routes have at least 1 leg)
        legs.forEach((leg, legIndex) => {
            // If the route is the first geo-input, we skip adding the leg...
            // ... since it's expected to be already in the origin "location"
            if (geoInputIndex > 0 || legIndex > 0) {
                pointWaypoints.push({
                    supportingPointIndex: supportingPointsLengthBeforePath + (leg.startPointIndex as number),
                    waypointSourceType: "USER_DEFINED"
                });
            }
        });
        // If the route isn't the last geo-input, we add its destination as pointWaypoint too:
        // (If it's the last geo-input, we skip adding the leg...
        // ... since it's expected to be already in the destination "location")
        if (geoInputIndex < geoInputs.length - 1) {
            pointWaypoints.push({
                supportingPointIndex: supportingPointsLengthBeforePath + pathGeoInput.geometry.coordinates.length - 1,
                waypointSourceType: "USER_DEFINED"
            });
        }
    }
};

// appends a waypoint into the given post data, adding to supportingPoints and pointWaypoints as applicable
const appendWaypointPOSTData = (
    waypoint: WaypointLike,
    geoInputIndex: number,
    geoInputs: GeoInput[],
    supportingPoints: LatitudeLongitudePointAPI[],
    pointWaypoints: PointWaypointAPI[]
) => {
    // individual points are treated like POST waypoints
    supportingPoints.push(toLatLngPointAPI(getLngLatArray(waypoint)));
    // for origin and destination we do not add pointWaypoints, since they end up as the URL "locations":
    if (geoInputIndex > 0 && geoInputIndex < geoInputs.length - 1) {
        pointWaypoints.push({
            supportingPointIndex: supportingPoints.length - 1,
            waypointSourceType: "USER_DEFINED"
        });
    }
};

const buildGeoInputsPOSTData = (
    geoInputs: GeoInput[],
    types: GeoInputType[]
): { supportingPoints: LatitudeLongitudePointAPI[]; pointWaypoints?: PointWaypointAPI[] } => {
    const supportingPoints: LatitudeLongitudePointAPI[] = [];
    const pointWaypoints: PointWaypointAPI[] = [];

    geoInputs.forEach((geoInput, geoInputIndex) => {
        if (types[geoInputIndex] === "path") {
            appendPathPOSTData(geoInput as PathLike, geoInputIndex, geoInputs, supportingPoints, pointWaypoints);
        } else {
            appendWaypointPOSTData(
                geoInput as WaypointLike,
                geoInputIndex,
                geoInputs,
                supportingPoints,
                pointWaypoints
            );
        }
    });

    return { supportingPoints, ...(pointWaypoints.length && { pointWaypoints }) };
};

const buildPOSTData = (params: CalculateRouteParams, types: GeoInputType[]): CalculateRoutePOSTDataAPI | null => {
    const pathsIncluded = types.includes("path");
    const ldevr = isLDEVR(params);
    if (!pathsIncluded && !ldevr) {
        // (if no paths in the given geoInputs nor LDEVR, there'll be no POST data, which will trigger a GET call)
        return null;
    }

    return {
        ...(pathsIncluded && buildGeoInputsPOSTData(params.geoInputs, types))
    };
};

/**
 * Default method for building calculate route request from {@link CalculateRouteParams}
 * @param params The calculate route parameters, with global configuration already merged into them.
 */
export const buildCalculateRouteRequest = (params: CalculateRouteParams): FetchInput<CalculateRoutePOSTDataAPI> => {
    const geoInputTypes = params.geoInputs.map(getGeoInputType);
    const url = new URL(`${buildURLBasePath(params)}/${buildLocationsString(params.geoInputs, geoInputTypes)}/json`);
    const urlParams: URLSearchParams = url.searchParams;

    appendCommonParams(urlParams, params, true);
    appendCommonRoutingParams(urlParams, params);
    appendOptionalParam(urlParams, "computeTravelTimeFor", params.computeAdditionalTravelTimeFor);
    params.currentHeading && urlParams.append("vehicleHeading", String(params.currentHeading));
    appendGuidanceParams(urlParams, params);
    !isNil(params.maxAlternatives) && urlParams.append("maxAlternatives", String(params.maxAlternatives));
    appendSectionTypes(urlParams, params.sectionTypes, !!params.guidance?.type);
    params.extendedRouteRepresentations?.forEach((extendedRouteRepresentation) => {
        urlParams.append("extendedRouteRepresentation", extendedRouteRepresentation);
    });
    urlParams.append("apiVersion", String(params.apiVersion || isLDEVR(params) ? 2 : 1));

    const postData = buildPOSTData(params, geoInputTypes);
    return postData ? { method: "POST", url, data: postData } : { method: "GET", url };
};
