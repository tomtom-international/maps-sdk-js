import { Guidance, Instruction, Summary, TrafficCategory, TrafficIncidentTEC, TravelMode } from "@anw/go-sdk-js/core";

/**
 * @group Calculate Route
 * @category Types
 */
export type ReportAPI = {
    effectiveSettings: { key: string; value: string }[];
};

/**
 * @group Calculate Route
 * @category Types
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
 * @group Calculate Route
 * @category Types
 */
export type SectionAPI = {
    sectionType: SectionTypeAPI;
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

/**
 * @group Calculate Route
 * @category Types
 */
export type SummaryAPI = Omit<Summary, "arrivalTime" | "departureTime"> & {
    arrivalTime: string;
    departureTime: string;
};

/**
 * @group Calculate Route
 * @category Types
 */
export type LatLngAPI = {
    latitude: number;
    longitude: number;
};

/**
 * @group Calculate Route
 * @category Types
 */
export type LegAPI = {
    points: LatLngAPI[];
    summary: SummaryAPI;
};

/**
 * @group Calculate Route
 * @category Types
 */
export type InstructionAPI = Omit<Instruction, "point"> & {
    point: {
        latitude: number;
        longitude: number;
    };
};

/**
 * @group Calculate Route
 * @category Types
 */
export type GuidanceAPI = Omit<Guidance, "instructions"> & {
    instructions: InstructionAPI[];
};
/**
 * @group Calculate Route
 * @category Types
 */
export type RouteAPI = {
    legs: LegAPI[];
    sections: SectionAPI[];
    summary: SummaryAPI;
    guidance?: GuidanceAPI;
};

/**
 * @group Calculate Route
 * @category Types
 */
export type CalculateRouteResponseAPI = {
    formatVersion: string;
    routes: RouteAPI[];
    optimizedWaypoints?: { providedIndex: number; optimizedIndex: number }[];
    report?: ReportAPI;
};
