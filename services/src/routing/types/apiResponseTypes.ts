import {
    BatteryCharging,
    Guidance,
    Instruction,
    LegSummary,
    PlugType,
    RouteSummary,
    TrafficIncidentTEC,
    TravelMode
} from "@anw/maps-sdk-js/core";

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
    | "CARPOOL"
    | "LOW_EMISSION_ZONE";

/**
 * @ignore
 */
export type TrafficCategoryAPI = "JAM" | "ROAD_WORK" | "ROAD_CLOSURE" | "OTHER";

/**
 * @ignore
 */
export type SectionAPI = {
    sectionType: SectionTypeAPI;
    startPointIndex: number;
    endPointIndex: number;
    travelMode?: TravelMode | "other";
    countryCode?: string;
    simpleCategory?: TrafficCategoryAPI;
    magnitudeOfDelay?: number;
    effectiveSpeedInKmh?: number;
    delayInSeconds?: number;
    tec?: TrafficIncidentTEC;
};

/**
 * @ignore
 */
export type CurrentTypeAPI = "Direct_Current" | "Alternating_Current_1_Phase" | "Alternating_Current_3_Phase";

// We focus on defining the (internal) API type reusing as much as possible from the SDK one.
// This helps to track how the parsing logic "forwards" all the API parts which are the same in SDK.
/**
 * @ignore
 */
export type SummaryAPI = Omit<
    RouteSummary & LegSummary,
    | "arrivalTime"
    | "departureTime"
    | "batteryConsumptionInPCT"
    | "remainingChargeAtArrivalInPCT"
    | "chargingInformationAtEndOfLeg"
> & {
    arrivalTime: string;
    departureTime: string;
    chargingInformationAtEndOfLeg?: Omit<BatteryCharging, "targetChargePCT" | "chargingConnectionInfo"> & {
        chargingConnectionInfo: {
            chargingVoltageInV: number;
            chargingCurrentInA: number;
            chargingCurrentType: CurrentTypeAPI;
            chargingPlugType: PlugType;
            chargingPowerInkW: number;
        };
    };
};

/**
 * @ignore
 * @see {@link https://developer.tomtom.com/routing-api/documentation/routing/common-routing-parameters point}
 */
export type LatitudeLongitudePointAPI = {
    latitude: number;
    longitude: number;
};

/**
 * @ignore
 */
export type LegAPI = {
    points: LatitudeLongitudePointAPI[];
    summary: SummaryAPI;
};

/**
 * @ignore
 */
export type InstructionAPI = Omit<Instruction, "point"> & {
    point: LatitudeLongitudePointAPI;
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
