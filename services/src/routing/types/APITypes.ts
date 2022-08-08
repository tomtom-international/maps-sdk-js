import { Guidance, TravelMode } from "@anw/go-sdk-js/core";
import { TrafficCategory, TrafficIncidentTEC } from "core/src/types/route/Sections";

export type APIReport = {
    effectiveSettings: { key: string; value: string }[];
};

export type APISectionType =
    | "CAR_TRAIN"
    | "COUNTRY"
    | "FERRY"
    | "MOTORWAY"
    | "PEDESTRIAN"
    | "TOLL_ROAD"
    | "TOLL_VIGNETTE"
    | "TRAFFIC"
    | "TRAVEL_MODE"
    | "TUNNEL"
    | "UNPAVED"
    | "URBAN";

export type APIRouteSection = {
    sectionType: APISectionType;
    startPointIndex: number;
    endPointIndex: number;
    travelMode?: TravelMode;
    countryCode?: string;
    simpleCategory?: TrafficCategory;
    magnitudeOfDelay?: number;
    effectiveSpeedInKmh?: number;
    delayInSeconds?: number;
    tec?: TrafficIncidentTEC[];
};

export type APIRouteSummary = {
    arrivalTime: string;
    departureTime: string;
    lengthInMeters: number;
    trafficDelayInSeconds: number;
    travelTimeInSeconds: number;
    trafficLengthInMeters: number;
};

export type APILatLng = {
    latitude: number;
    longitude: number;
};

export type APIRouteLeg = {
    points: APILatLng[];
    summary: APIRouteSummary;
};

export type APIRoute = {
    legs: APIRouteLeg[];
    sections: APIRouteSection[];
    summary: APIRouteSummary;
    guidance?: Guidance;
};

export type APICalculateRouteResult = {
    formatVersion: string;
    routes: APIRoute[];
    optimizedWaypoints?: { providedIndex: number; optimizedIndex: number }[];
    report?: APIReport;
};
