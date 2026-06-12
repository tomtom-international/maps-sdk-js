import type {
    ChargingStopProps,
    Instruction,
    PlugType,
    RoadShieldReference,
    TrafficIncidentTEC,
    TravelMode,
} from '@tomtom-org/maps-sdk/core';
import type { LineString, Point } from 'geojson';

/**
 * V3 traffic section icon categories.
 * @ignore
 */
export type IconCategoryAPI =
    | 'jam'
    | 'accident'
    | 'brokenDownVehicle'
    | 'dangerousConditions'
    | 'flooding'
    | 'fog'
    | 'ice'
    | 'laneClosed'
    | 'rain'
    | 'roadClosed'
    | 'roadWorks'
    | 'wind';

/**
 * V3 delay magnitude values. `'undefined'` is the raw API value mapped to SDK `'indefinite'`.
 * @ignore
 */
export type DelayMagnitudeAPI = 'unknown' | 'minor' | 'moderate' | 'major' | 'undefined';

/**
 * Lat/lon point used by non-routing services (e.g. reachable-range).
 * @ignore
 */
export type LatitudeLongitudePointAPI = {
    latitude: number;
    longitude: number;
};

/**
 * @ignore
 */
export type ReportAPI = {
    effectiveSettings: { key: string; value: string }[];
};

/**
 * @ignore
 */
export type CurrentTypeAPI = 'Direct_Current' | 'Alternating_Current_1_Phase' | 'Alternating_Current_3_Phase';

/**
 * @ignore
 */
export type ChargingParkLocationAPI = {
    coordinate: { latitude: number; longitude: number };
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

/**
 * V3 summary — field names changed from V2.
 * @ignore
 */
export type SummaryAPI = {
    lengthInMeters: number;
    travelDurationInSeconds: number;
    trafficDelayDurationInSeconds?: number;
    trafficLengthInMeters?: number;
    departureDateTime: string;
    arrivalDateTime: string;
    deviationDistanceInMeters?: number;
    deviationDurationInSeconds?: number;
    deviationPoint?: Point;
    // Traffic variant times (returned via additionalProperties when computeTravelTimeFor=all was used)
    historicTrafficTravelTimeInSeconds?: number;
    liveTrafficIncidentsTravelTimeInSeconds?: number;
    noTrafficTravelTimeInSeconds?: number;
    // EV-specific
    totalChargingTimeInSeconds?: number;
    batteryConsumptionInkWh?: number;
    batteryConsumptionInKilowattHours?: number;
    remainingChargeAtArrivalInkWh?: number;
    fuelConsumptionInLiters?: number;
    chargingInformationAtEndOfLeg?: ChargingStopAPI;
};

/**
 * V3 leg — path is now a GeoJSON LineString instead of a points array.
 * @ignore
 */
export type LegAPI = {
    path: LineString;
    summary: SummaryAPI;
};

/**
 * V3 basic section — uses pathIndex instead of pointIndex.
 * @ignore
 */
export type BasicSectionAPI = {
    startPathIndex: number;
    endPathIndex: number;
};

/**
 * @ignore
 */
export type CountrySectionAPI = BasicSectionAPI & {
    countryCodeIso2?: string;
};

/**
 * @ignore
 */
export type TravelModeSectionAPI = BasicSectionAPI & {
    travelMode?: TravelMode | 'other';
};

/**
 * @ignore
 */
export type TrafficSectionAPI = BasicSectionAPI & {
    effectiveSpeedInKilometersPerHour?: number;
    delayDurationInSeconds?: number;
    delayMagnitude?: DelayMagnitudeAPI;
    tec?: TrafficIncidentTEC;
    iconCategory?: IconCategoryAPI;
    eventId?: string;
};

/**
 * V3 speed limit section — speed values live under `speedRestrictions` (typed maximum/minimum)
 * instead of the V2 flat `maxSpeedLimitInKmh`.
 * @ignore
 */
export type SpeedLimitSectionAPI = BasicSectionAPI & {
    speedRestrictions?: { type: 'maximum' | 'minimum'; inKilometersPerHour: number }[];
};

/**
 * V3 lanes section — directions/separators are camelCase strings (mapped to the SDK's
 * UPPER_SNAKE enums during parsing), and lanes are objects rather than flat direction lists.
 * @ignore
 */
export type LanesSectionAPI = BasicSectionAPI & {
    lanes?: { directions: string[]; follow?: string; laneType?: string; tollPaymentTypes?: string[] }[];
    laneSeparators?: string[];
    properties?: string[];
};

/**
 * @ignore
 */
export type ImportantRoadStretchSectionAPI = BasicSectionAPI & {
    importantRoadStretchIndex: number;
    streetName?: { text: string };
    roadNumbers?: { text: string }[];
};

/**
 * V3 sections object — already grouped by type (no flat array + discriminator).
 * @ignore
 */
export type SectionsAPI = {
    carTrain?: BasicSectionAPI[];
    ferry?: BasicSectionAPI[];
    tunnel?: BasicSectionAPI[];
    motorway?: BasicSectionAPI[];
    pedestrian?: BasicSectionAPI[];
    toll?: BasicSectionAPI[];
    country?: CountrySectionAPI[];
    travelMode?: TravelModeSectionAPI[];
    traffic?: TrafficSectionAPI[];
    carpool?: BasicSectionAPI[];
    urban?: BasicSectionAPI[];
    unpaved?: BasicSectionAPI[];
    lowEmissionZone?: BasicSectionAPI[];
    speedLimit?: SpeedLimitSectionAPI[];
    lanes?: LanesSectionAPI[];
    roadShields?: (BasicSectionAPI & { roadShieldReferences?: RoadShieldReference[] })[];
    tollVignette?: CountrySectionAPI[];
    importantRoadStretch?: ImportantRoadStretchSectionAPI[];
};

/**
 * V3 lat/lon point used in guidance instructions (different from GeoJSON used elsewhere).
 * @ignore
 */
export type LatLonPointAPI = {
    latitude: number;
    longitude: number;
};

/**
 * V3 routePath point — field names changed from V2.
 * @ignore
 */
export type RoutePathPointAPI = {
    point: LatLonPointAPI;
    distanceFromRouteStartInMeters: number;
    travelTimeFromRouteStartInSeconds: number;
};

/**
 * V3 phonetic transcription — an object keyed by phonetic alphabet, not a flat string as in V2.
 * @ignore
 */
export type PhoneticAPI = { lhp?: string; ipa?: string };

/**
 * V3 text-with-phonetics — `phonetic` is now an object (mapped to a flat string during parsing).
 * @ignore
 */
export type TextWithPhoneticsAPI = { text: string; phonetic?: PhoneticAPI; phoneticLanguageCode?: string };

/**
 * V3 icon reference — same shape as the SDK's RoadShieldReference.
 * @ignore
 */
export type IconReferenceAPI = { reference: string; shieldContent?: string; affixes?: string[] };

/**
 * V3 road shield inside an instruction's road information. `iconReference` is EXPLICIT.
 * @ignore
 */
export type InstructionRoadShieldAPI = {
    roadNumber?: TextWithPhoneticsAPI;
    countryCodeIso2?: string;
    countrySubdivisionCodeIso?: string;
    iconReference?: IconReferenceAPI;
};

/**
 * V3 road information inside an instruction — field names changed from V2.
 * @ignore
 */
export type InstructionRoadInformationAPI = {
    properties?: string[];
    roadShields?: InstructionRoadShieldAPI[];
    roadNames?: Array<{ identifier: TextWithPhoneticsAPI }>;
    roadNumbers?: Array<{ identifier: TextWithPhoneticsAPI }>;
};

/**
 * V3 signpost — adds an EXPLICIT `exitIconReference` (mapped to signpostRoadShieldReferences).
 * @ignore
 */
export type SignpostAPI = {
    exitName?: TextWithPhoneticsAPI;
    exitNumber?: TextWithPhoneticsAPI;
    towardName?: TextWithPhoneticsAPI;
    exitIconReference?: IconReferenceAPI;
};

/**
 * V3 instruction — raw response shape. Coordinates are lat/lon (not GeoJSON), and several field
 * names / value casings differ from the SDK's {@link Instruction}; the parser converts them.
 * @ignore
 */
export type InstructionAPI = {
    routeOffsetInMeters: number;
    maneuver?: string;
    maneuverPoint: LatLonPointAPI;
    routePath?: RoutePathPointAPI[];
    nextRoadInformation?: InstructionRoadInformationAPI;
    previousRoadInformation?: InstructionRoadInformationAPI;
    signpost?: SignpostAPI;
    intersectionName?: TextWithPhoneticsAPI;
    drivingSide?: 'left' | 'right';
    landmark?: string;
    distanceToPreviousTrafficLightInMeters?: number;
    ambiguousExitOffsetFromManeuverInMeters?: number;
    roundaboutExitNumber?: number;
    isManeuverObligatory?: boolean;
    changeOfAngleInDegrees?: number;
    tollgateName?: TextWithPhoneticsAPI;
    tollPaymentTypes?: string[];
    countryCrossingFromName?: TextWithPhoneticsAPI;
    countryCrossingFromCodeIso2?: string;
    countryCrossingToName?: TextWithPhoneticsAPI;
    countryCrossingToCodeIso2?: string;
    sideRoads?: Instruction['sideRoads'];
};

/**
 * V3 progress point — field names differ from the SDK's RouteProgressPoint.
 * @ignore
 */
export type ProgressPointAPI = {
    pathIndex: number;
    distanceInMeters?: number;
    travelDurationInSeconds?: number;
};

/**
 * @ignore
 */
export type RouteAPI = {
    legs: LegAPI[];
    sections?: SectionsAPI;
    summary: SummaryAPI;
    instructions?: InstructionAPI[];
    progressPoints?: ProgressPointAPI[];
};

/**
 * @ignore
 */
export type CalculateRouteResponseAPI = {
    routes: RouteAPI[];
    /**
     * Base URL of the Road Shields service (EXPLICIT, top-level). Applied to every instruction's
     * `roadShieldAtlasReference`. Requested via the top-level `roadShieldAtlasReference` attribute.
     */
    roadShieldAtlasReference?: string;
};
