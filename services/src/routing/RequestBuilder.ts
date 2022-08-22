import isNil from "lodash/isNil";
import {
    CalculateRouteParams,
    DepartArriveParams,
    InputSectionTypes,
    ThrillingParams,
    WaypointInput,
    WaypointInputs
} from "./types/CalculateRouteParams";
import { CommonServiceParams } from "../shared/ServiceTypes";
import { Avoidable, getLngLatArray, inputSectionTypes, Waypoint, WaypointProps } from "@anw/go-sdk-js/core";
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

const appendAvoidParams = (urlParams: URLSearchParams, avoid?: Avoidable[]): void => {
    if (avoid) {
        for (const avoidOption of avoid) {
            urlParams.append("avoid", avoidOption);
        }
    }
};

const appendWhenParams = (urlParams: URLSearchParams, when?: DepartArriveParams): void => {
    if (when?.date) {
        const formattedDate = when.date.toISOString();
        if (when.option == "departAt") {
            urlParams.append("departAt", formattedDate);
        } else if (when.option == "arriveBy") {
            urlParams.append("arriveAt", formattedDate);
        }
    }
};

const appendThrillingParams = (urlParams: URLSearchParams, thrillingParams?: ThrillingParams): void => {
    if (thrillingParams) {
        thrillingParams.hilliness && urlParams.append("hilliness", thrillingParams.hilliness);
        thrillingParams.windingness && urlParams.append("windingness", thrillingParams.windingness);
    }
};

const appendSectionTypes = (urlParams: URLSearchParams, sectionTypes?: InputSectionTypes): void => {
    const effectiveSectionTypes = sectionTypes == "all" ? inputSectionTypes : sectionTypes || [];
    for (const sectionType of effectiveSectionTypes) {
        urlParams.append("sectionType", sectionType);
    }
};

export const buildCalculateRouteRequest = (params: CalculateRouteParams): URL => {
    const url = new URL(`${buildURLBasePath(params)}${buildWaypointsString(params.locations)}/json`);
    const urlParams: URLSearchParams = url.searchParams;
    appendCommonParams(urlParams, params);
    appendAvoidParams(urlParams, params.avoid);
    params.computeAdditionalTravelTimeFor &&
        urlParams.append("computeTravelTimeFor", params.computeAdditionalTravelTimeFor);
    params.considerTraffic && urlParams.append("traffic", String(params.considerTraffic));
    appendWhenParams(urlParams, params.when);
    params.instructionsType && urlParams.append("instructionsType", params.instructionsType);
    !isNil(params.maxAlternatives) && urlParams.append("maxAlternatives", String(params.maxAlternatives));
    params.routeRepresentation && urlParams.append("routeRepresentation", params.routeRepresentation);
    params.routeType && urlParams.append("routeType", params.routeType);
    appendSectionTypes(urlParams, params.sectionTypes);
    params.travelMode && urlParams.append("travelMode", params.travelMode);
    if (params.routeType == "thrilling") {
        appendThrillingParams(urlParams, params.thrillingParams);
    }
    return url;
};
