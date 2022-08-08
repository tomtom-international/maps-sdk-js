import isNil from "lodash/isNil";
import { CalculateRouteParams, WaypointInput, WaypointInputs } from "./types/CalculateRouteParams";
import { CommonServiceParams } from "../shared/ServiceTypes";
import { getLngLatArray, inputSectionTypes, Waypoint, WaypointProps } from "@anw/go-sdk-js/core";
import { appendCommonParams } from "../shared/RequestBuildingUtils";

const buildURLBasePath = (params: CommonServiceParams): string =>
    params.customServiceBaseURL || `${params.commonBaseURL}routing/1/calculateRoute/`;

const getWaypointProps = (waypointInput: WaypointInput): WaypointProps | null =>
    (waypointInput as Waypoint).properties || null;

const buildWaypointsString = (waypointInputs: WaypointInputs): string => {
    return waypointInputs
        .map((waypointInput: WaypointInput) => {
            const lngLat = getLngLatArray(waypointInput);
            const lngLatString = `${lngLat[1]},${lngLat[0]}`;
            const radius = getWaypointProps(waypointInput)?.radiusMeters;
            return radius ? `circle(${lngLatString},${radius})` : lngLatString;
        })
        .join(":");
};

export const buildCalculateRouteRequest = (params: CalculateRouteParams): URL => {
    const url = new URL(`${buildURLBasePath(params)}${buildWaypointsString(params.locations)}/json`);
    const urlParams = url.searchParams;
    appendCommonParams(urlParams, params);
    if (params.avoid) {
        for (const avoidOption of params.avoid) {
            urlParams.append("avoid", avoidOption);
        }
    }
    params.computeAdditionalTravelTimeFor &&
        urlParams.append("computeTravelTimeFor", params.computeAdditionalTravelTimeFor);
    params.considerTraffic && urlParams.append("traffic", String(params.considerTraffic));
    if (params.when?.date) {
        const formattedDate = params.when.date.toISOString();
        if (params.when.option == "departAt") {
            urlParams.append("departAt", formattedDate);
        } else if (params.when.option == "arriveBy") {
            urlParams.append("arriveAt", formattedDate);
        }
    }
    params.instructionsType && urlParams.append("instructionsType", params.instructionsType);
    !isNil(params.maxAlternatives) && urlParams.append("maxAlternatives", String(params.maxAlternatives));
    params.routeRepresentation && urlParams.append("routeRepresentation", params.routeRepresentation);
    params.routeType && urlParams.append("routeType", params.routeType);
    const sectionTypes = params.sectionTypes == "all" ? inputSectionTypes : params.sectionTypes || [];
    for (const sectionType of sectionTypes) {
        urlParams.append("sectionType", sectionType);
    }
    params.travelMode && urlParams.append("travelMode", params.travelMode);
    if (params.routeType == "thrilling" && params.thrillingParams) {
        params.thrillingParams.hilliness && urlParams.append("hilliness", params.thrillingParams.hilliness);
        params.thrillingParams.windingness && urlParams.append("windingness", params.thrillingParams.windingness);
    }
    return url;
};
