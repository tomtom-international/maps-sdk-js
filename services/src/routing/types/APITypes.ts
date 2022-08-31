import { Guidance, Instruction, Summary, TravelMode } from "@anw/go-sdk-js/core";
import { TrafficCategory, TrafficIncidentTEC } from "core/src/types/route/Sections";

export type ReportAPI = {
    effectiveSettings: { key: string; value: string }[];
};

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
    | "URBAN";

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

export type SummaryAPI = Omit<Summary, "arrivalTime" | "departureTime"> & {
    arrivalTime: string;
    departureTime: string;
};

export type LatLngAPI = {
    latitude: number;
    longitude: number;
};

export type LegAPI = {
    points: LatLngAPI[];
    summary: SummaryAPI;
};

export type InstructionAPI = Omit<Instruction, "point"> & {
    point: {
        latitude: number;
        longitude: number;
    };
};

export type GuidanceAPI = Omit<Guidance, "instructions"> & {
    instructions: InstructionAPI[];
};

export type RouteAPI = {
    legs: LegAPI[];
    sections: SectionAPI[];
    summary: SummaryAPI;
    guidance?: GuidanceAPI;
};

export type CalculateRouteResultAPI = {
    formatVersion: string;
    routes: RouteAPI[];
    optimizedWaypoints?: { providedIndex: number; optimizedIndex: number }[];
    report?: ReportAPI;
};
