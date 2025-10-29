import type {
    GetPositionEntryPointOption,
    PathLike,
    RoutePlanningLocation,
    RoutePlanningLocationType,
    Waypoint,
    WaypointLike,
    WaypointProps,
} from '@cet/maps-sdk-js/core';
import {
    getPositionStrict,
    getRoutePlanningLocationType,
    inputSectionTypes,
    inputSectionTypesWithGuidance,
} from '@cet/maps-sdk-js/core';
import type { Position } from 'geojson';
import { isNil, omit } from 'lodash-es';
import type { FetchInput } from '../shared';
import { VehiclePreferences } from '../shared';
import { positionToCSVLatLon } from '../shared/geometry';
import { appendCommonRoutingParams } from '../shared/request/commonRoutingRequestBuilder';
import {
    appendByRepeatingParamName,
    appendCommonParams,
    appendOptionalParam,
} from '../shared/request/requestBuildingUtils';
import { ExplicitVehicleModel } from '../shared/types/vehicleModel';
import type { CalculateRoutePOSTDataAPI, PointWaypointAPI } from './types/apiRequestTypes';
import type { LatitudeLongitudePointAPI } from './types/apiResponseTypes';
import type { CalculateRouteParams, GuidanceParams, InputSectionTypes } from './types/calculateRouteParams';

// Are these params about Long Distance EV Routing:
const getChargingPreferences = (params: CalculateRouteParams) =>
    (params.vehicle?.preferences as VehiclePreferences<'electric'>)?.chargingPreferences;

const buildUrlBasePath = (params: CalculateRouteParams): string =>
    params.customServiceBaseURL ||
    `${params.commonBaseURL}/maps/orbis/routing/${getChargingPreferences(params) ? 'calculateLongDistanceEVRoute' : 'calculateRoute'}`;

const getWaypointProps = (waypointInput: WaypointLike): WaypointProps | null =>
    (waypointInput as Waypoint).properties || null;

const defaultUseEntryPointOption: GetPositionEntryPointOption = 'main-when-available';

const buildLocationsStringFromWaypoints = (
    waypointInputs: WaypointLike[],
    useEntryPoint: GetPositionEntryPointOption,
): string =>
    waypointInputs
        .map((waypointInput: WaypointLike) => {
            const lngLatString = positionToCSVLatLon(getPositionStrict(waypointInput, { useEntryPoint }));
            const radius = getWaypointProps(waypointInput)?.radiusMeters;
            return radius ? `circle(${lngLatString},${radius})` : lngLatString;
        })
        .join(':');

const getPositionsFromPath = (pathLike: PathLike): Position[] => {
    if (Array.isArray(pathLike)) {
        return pathLike;
    }
    return pathLike.geometry.coordinates;
};

const getFirstAndLastPoints = (
    locations: RoutePlanningLocation[],
    types: RoutePlanningLocationType[],
    useEntryPoint: GetPositionEntryPointOption,
): [Position, Position] => {
    let firstPoint;
    const firstRoutePlanningLocation = locations[0];
    if (types[0] === 'path') {
        const positions = getPositionsFromPath(firstRoutePlanningLocation as PathLike);
        firstPoint = positions[0];
    } else {
        firstPoint = getPositionStrict(firstRoutePlanningLocation as WaypointLike, { useEntryPoint });
    }

    const lastRoutePlanningLocation = locations[locations.length - 1];
    let lastPoint;
    if (types[types.length - 1] === 'path') {
        const positions = getPositionsFromPath(lastRoutePlanningLocation as PathLike);
        lastPoint = positions[positions.length - 1];
    } else {
        lastPoint = getPositionStrict(lastRoutePlanningLocation as WaypointLike, { useEntryPoint });
    }

    return [firstPoint, lastPoint];
};

const buildLocationsString = (
    locations: RoutePlanningLocation[],
    routePlanningLocationTypes: RoutePlanningLocationType[],
    useEntryPoint: GetPositionEntryPointOption,
): string =>
    buildLocationsStringFromWaypoints(
        routePlanningLocationTypes.includes('path')
            ? getFirstAndLastPoints(locations, routePlanningLocationTypes, useEntryPoint)
            : (locations as WaypointLike[]),
        useEntryPoint,
    );

const appendSectionTypes = (
    urlParams: URLSearchParams,
    sectionTypes: InputSectionTypes | undefined,
    instructionsInclude: boolean,
): void => {
    const effectiveSectionTypes = (
        sectionTypes ?? (instructionsInclude ? inputSectionTypesWithGuidance : inputSectionTypes)
    ).map((sectionType) => (sectionType === 'vehicleRestricted' ? 'travelMode' : sectionType));
    appendByRepeatingParamName(urlParams, 'sectionType', effectiveSectionTypes);
};

const appendGuidanceParams = (urlParams: URLSearchParams, params?: CalculateRouteParams): void => {
    if (params?.guidance) {
        const guidance: GuidanceParams = params.guidance;
        urlParams.append('instructionsType', guidance.type);
        urlParams.append('guidanceVersion', String(guidance.version ?? 2));
        urlParams.append('instructionPhonetics', guidance.phonetics ?? 'IPA');
        urlParams.append('instructionRoadShieldReferences', guidance.roadShieldReferences ?? 'all');
        urlParams.append('language', params.language ?? 'en-US');
    }
};

const toLatLngPointApi = (position: Position): LatitudeLongitudePointAPI => ({
    latitude: position[1],
    longitude: position[0],
});

// appends a path into the given post data, adding to supportingPoints and pointWaypoints as applicable
const appendPathPostData = (
    pathRoutePlanningLocation: PathLike,
    routePlanningLocationIndex: number,
    locations: RoutePlanningLocation[],
    supportingPoints: LatitudeLongitudePointAPI[],
    pointWaypoints: PointWaypointAPI[],
): void => {
    // first, we add the supportingPoints from the path coordinates:
    const supportingPointsLengthBeforePath = supportingPoints.length;
    for (const position of getPositionsFromPath(pathRoutePlanningLocation)) {
        supportingPoints.push(toLatLngPointApi(position));
    }
    // then we check if it's a route, and if so we add waypoints from its legs as applicable
    // (a route leg is the portion of the path between 2 waypoints)
    if (!Array.isArray(pathRoutePlanningLocation)) {
        const legs = pathRoutePlanningLocation.properties.sections.leg;
        // (We assume all routes have at least 1 leg)
        legs.forEach((leg, legIndex) => {
            // If the route is the first geo-input, we skip adding the leg...
            // ... since it's expected to be already in the origin "location"
            if (routePlanningLocationIndex > 0 || legIndex > 0) {
                pointWaypoints.push({
                    supportingPointIndex: supportingPointsLengthBeforePath + (leg.startPointIndex as number),
                    waypointSourceType: 'USER_DEFINED',
                });
            }
        });
        // If the route isn't the last geo-input, we add its destination as pointWaypoint too:
        // (If it's the last geo-input, we skip adding the leg...
        // ... since it's expected to be already in the destination "location")
        if (routePlanningLocationIndex < locations.length - 1) {
            pointWaypoints.push({
                supportingPointIndex:
                    supportingPointsLengthBeforePath + pathRoutePlanningLocation.geometry.coordinates.length - 1,
                waypointSourceType: 'USER_DEFINED',
            });
        }
    }
};

// appends a waypoint into the given post data, adding to supportingPoints and pointWaypoints as applicable
const appendWaypointPostData = (
    waypoint: WaypointLike,
    routePlanningLocationIndex: number,
    locations: RoutePlanningLocation[],
    supportingPoints: LatitudeLongitudePointAPI[],
    pointWaypoints: PointWaypointAPI[],
    useEntryPoint: GetPositionEntryPointOption,
) => {
    // individual points are treated like POST waypoints
    supportingPoints.push(toLatLngPointApi(getPositionStrict(waypoint, { useEntryPoint })));
    // for origin and destination we do not add pointWaypoints, since they end up as the URL "locations":
    if (routePlanningLocationIndex > 0 && routePlanningLocationIndex < locations.length - 1) {
        pointWaypoints.push({
            supportingPointIndex: supportingPoints.length - 1,
            waypointSourceType: 'USER_DEFINED',
        });
    }
};

const buildlocationsPostData = (
    locations: RoutePlanningLocation[],
    types: RoutePlanningLocationType[],
    useEntryPoints: GetPositionEntryPointOption,
): { supportingPoints: LatitudeLongitudePointAPI[]; pointWaypoints?: PointWaypointAPI[] } => {
    const supportingPoints: LatitudeLongitudePointAPI[] = [];
    const pointWaypoints: PointWaypointAPI[] = [];

    locations.forEach((routePlanningLocation, routePlanningLocationIndex) => {
        if (types[routePlanningLocationIndex] === 'path') {
            appendPathPostData(
                routePlanningLocation as PathLike,
                routePlanningLocationIndex,
                locations,
                supportingPoints,
                pointWaypoints,
            );
        } else {
            appendWaypointPostData(
                routePlanningLocation as WaypointLike,
                routePlanningLocationIndex,
                locations,
                supportingPoints,
                pointWaypoints,
                useEntryPoints,
            );
        }
    });

    return { supportingPoints, ...(pointWaypoints.length && { pointWaypoints }) };
};

const buildPostData = (
    params: CalculateRouteParams,
    types: RoutePlanningLocationType[],
    useEntryPoints: GetPositionEntryPointOption,
): CalculateRoutePOSTDataAPI | null => {
    const pathsIncluded = types.includes('path');
    const isLdevr = !!getChargingPreferences(params);
    if (!pathsIncluded && !isLdevr) {
        // (if no paths in the given locations nor LDEVR, there'll be no POST data, which will trigger a GET call)
        return null;
    }

    const vehicleModel = params.vehicle?.model as ExplicitVehicleModel<'electric'>;
    const chargingModel = vehicleModel?.engine?.charging;
    return {
        ...(pathsIncluded && buildlocationsPostData(params.locations, types, useEntryPoints)),
        ...(isLdevr &&
            chargingModel && {
                chargingParameters: omit(chargingModel, 'maxChargeKWH'),
            }),
    };
};

/**
 * Default function for building calculate route request from {@link CalculateRouteParams}
 * @param params The calculate route parameters, with global configuration already merged into them.
 */
export const buildCalculateRouteRequest = (params: CalculateRouteParams): FetchInput<CalculateRoutePOSTDataAPI> => {
    const routePlanningLocationTypes = params.locations.map(getRoutePlanningLocationType);
    const useEntryPoints = params.useEntryPoints ?? defaultUseEntryPointOption;
    const url = new URL(
        `${buildUrlBasePath(params)}/${buildLocationsString(params.locations, routePlanningLocationTypes, useEntryPoints)}/json`,
    );
    const urlParams: URLSearchParams = url.searchParams;
    appendCommonParams(urlParams, params);
    if (!('language' in params)) {
        // for routing we ensure to always have a default language input since by default we fetch some language-specific sections:
        // (see importantRoadStretch as default, and instructionsType when guidance is provided)
        // It's still possible to force the language to be undefined if skipping such sections for performance reasons
        urlParams.append('language', 'en-GB');
    }
    appendCommonRoutingParams(urlParams, params);
    appendOptionalParam(urlParams, 'computeTravelTimeFor', params.computeAdditionalTravelTimeFor);
    appendGuidanceParams(urlParams, params);
    !isNil(params.maxAlternatives) && urlParams.append('maxAlternatives', String(params.maxAlternatives));
    appendSectionTypes(urlParams, params.sectionTypes, !!params.guidance?.type);
    for (const representation of params.extendedRouteRepresentations ?? ['distance', 'travelTime']) {
        urlParams.append('extendedRouteRepresentation', representation);
    }

    const postData = buildPostData(params, routePlanningLocationTypes, useEntryPoints);
    return postData ? { method: 'POST', url, data: postData } : { method: 'GET', url };
};
