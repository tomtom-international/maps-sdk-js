import { Guidance, Instruction, Summary, TrafficCategory, TrafficIncidentTEC, TravelMode } from "@anw/go-sdk-js/core";

/**
 * @ignore
 */
export type ReportAPI = {
    effectiveSettings: { key: string; value: string }[];
};

/**
 * @ignore
 */
export type SectionTypeAPI =
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
    | "URBAN"
    | "CARPOOL";

/**
 * @ignore
 */
export type SectionAPI = {
    sectionType: SectionTypeAPI;
    startPointIndex: number;
    endPointIndex: number;
    travelMode?: TravelMode | "other";
    countryCode?: string;
    simpleCategory?: TrafficCategory;
    magnitudeOfDelay?: number;
    effectiveSpeedInKmh?: number;
    delayInSeconds?: number;
    tec?: TrafficIncidentTEC;
};

/**
 * @ignore
 */
export type SummaryAPI = Omit<Summary, "arrivalTime" | "departureTime"> & {
    arrivalTime: string;
    departureTime: string;
};

/**
 * @ignore
 * @see {@link https://developer.tomtom.com/routing-api/documentation/routing/common-routing-parameters point}
 */
export type LatLngPointAPI = {
    latitude: number;
    longitude: number;
};

/**
 * @ignore
 */
export type LegAPI = {
    points: LatLngPointAPI[];
    summary: SummaryAPI;
};

/**
 * @ignore
 */
export type InstructionAPI = Omit<Instruction, "point"> & {
    point: LatLngPointAPI;
};

/**
 * @ignore
 */
export type GuidanceAPI = Omit<Guidance, "instructions"> & {
    instructions: InstructionAPI[];
};

/**
 * @ignore
 */
export type RouteAPI = {
    legs: LegAPI[];
    sections: SectionAPI[];
    summary: SummaryAPI;
    guidance?: GuidanceAPI;
};

/**
 * @ignore
 */
export type CalculateRouteResponseAPI = {
    formatVersion: string;
    routes: RouteAPI[];
    optimizedWaypoints?: { providedIndex: number; optimizedIndex: number }[];
    report?: ReportAPI;
};
