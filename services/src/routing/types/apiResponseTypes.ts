import type {
    ChargingStopProps,
    Guidance,
    Instruction,
    LaneDirection,
    LegSummary,
    PlugType,
    PossibleLaneSeparator,
    RoadShieldReference,
    RoutePathPoint,
    RouteProgress,
    RouteSummary,
    TrafficIncidentTEC,
    TravelMode,
} from '@tomtom-org/maps-sdk-js/core';

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
    | 'CAR_TRAIN'
    | 'COUNTRY'
    | 'FERRY'
    | 'MOTORWAY'
    | 'PEDESTRIAN'
    | 'TOLL'
    | 'TOLL_VIGNETTE'
    | 'TRAFFIC'
    | 'TRAVEL_MODE'
    | 'TUNNEL'
    | 'UNPAVED'
    | 'URBAN'
    | 'CARPOOL'
    | 'LOW_EMISSION_ZONE'
    | 'LANES'
    | 'SPEED_LIMIT'
    | 'ROAD_SHIELDS'
    | 'IMPORTANT_ROAD_STRETCH';

/**
 * @ignore
 */
export type TrafficCategoryAPI = 'JAM' | 'ROAD_WORK' | 'ROAD_CLOSURE' | 'OTHER';

/**
 * @ignore
 */
export type SectionAPI = {
    sectionType: SectionTypeAPI;
    startPointIndex: number;
    endPointIndex: number;
    travelMode?: TravelMode | 'other';
    countryCode?: string;
    simpleCategory?: TrafficCategoryAPI;
    magnitudeOfDelay?: number;
    effectiveSpeedInKmh?: number;
    delayInSeconds?: number;
    tec?: TrafficIncidentTEC;
    lanes?: LaneDirection[];
    laneSeparators?: PossibleLaneSeparator[];
    properties?: string[];
    maxSpeedLimitInKmh?: number;
    roadShieldReferences?: RoadShieldReference[];
    importantRoadStretchIndex?: number;
    streetName?: { text: string };
    roadNumbers?: string[];
};

/**
 * @ignore
 */
export type CurrentTypeAPI = 'Direct_Current' | 'Alternating_Current_1_Phase' | 'Alternating_Current_3_Phase';

/**
 * @ignore
 */
export type ChargingParkLocationAPI = {
    coordinate: LatitudeLongitudePointAPI;
    street?: string;
    houseNumber?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
};

/**
 * @ignore
 */
export type ChargingStopAPI = Omit<ChargingStopProps, 'targetChargeInPCT' | 'chargingConnectionInfo'> & {
    chargingParkLocation: ChargingParkLocationAPI;
    chargingConnectionInfo: {
        chargingVoltageInV: number;
        chargingCurrentInA: number;
        chargingCurrentType: CurrentTypeAPI;
        chargingPlugType: PlugType;
        chargingPowerInkW: number;
    };
};

// We focus on defining the (internal) API type reusing as much as possible from the SDK one.
// This helps to track how the parsing logic "forwards" all the API parts which are the same in SDK.
/**
 * @ignore
 */
export type SummaryAPI = Omit<
    RouteSummary & LegSummary,
    | 'arrivalTime'
    | 'departureTime'
    | 'batteryConsumptionInPCT'
    | 'remainingChargeAtArrivalInPCT'
    | 'chargingInformationAtEndOfLeg'
> & {
    arrivalTime: string;
    departureTime: string;
    chargingInformationAtEndOfLeg?: ChargingStopAPI;
};

/**
 * @ignore
 * @see {@link https://docs.tomtom.com/routing-api/documentation/routing/common-routing-parameters point}
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
export type RoutePathPointAPI = Omit<RoutePathPoint, 'point'> & {
    point: LatitudeLongitudePointAPI;
};

/**
 * @ignore
 */
export type InstructionAPI = Omit<Instruction, 'maneuverPoint' | 'routePath' | 'pathPointIndex'> & {
    maneuverPoint: LatitudeLongitudePointAPI;
    routePath: RoutePathPointAPI[];
};

/**
 * @ignore
 */
export type GuidanceAPI = Omit<Guidance, 'instructions'> & {
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
    progress?: RouteProgress;
};

/**
 * @ignore
 */
export type CalculateRouteResponseAPI = {
    formatVersion: string;
    routes: RouteAPI[];
    optimizedWaypoints?: { providedIndex: number; optimizedIndex: number }[];
    report?: ReportAPI;
    roadShieldAtlasReference?: string;
};
