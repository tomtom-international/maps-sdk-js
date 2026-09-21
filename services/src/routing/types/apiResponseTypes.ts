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
 * Traffic section icon categories.
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
 * Delay magnitude values. `'undefined'` is the raw API value mapped to SDK `'indefinite'`.
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
 * Route summary as the API returns it.
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
    // Leg-only: the index, among the requested locations, of the waypoint the leg ends at. Returned
    // without asking for anything extra in `Attributes`; absent on the final leg.
    originalWaypointIndexAtEndOfLeg?: number;
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
 * Route leg. Its path is a GeoJSON LineString, not a points array.
 * @ignore
 */
export type LegAPI = {
    path: LineString;
    summary: SummaryAPI;
};

/**
 * Basic section. Spans are expressed with pathIndex, not pointIndex.
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
 * Speed limit section — speed values live under `speedRestrictions` (typed maximum/minimum)
 * instead of the V2 flat `maxSpeedLimitInKmh`.
 * @ignore
 */
export type SpeedLimitSectionAPI = BasicSectionAPI & {
    speedRestrictions?: { type: 'maximum' | 'minimum'; inKilometersPerHour: number }[];
};

/**
 * Lanes section — directions/separators are camelCase strings (mapped to the SDK's
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
 * Sections object, grouped by type rather than a flat array with a discriminator.
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
    tollRoad?: BasicSectionAPI[];
    tollVignette?: CountrySectionAPI[];
    importantRoadStretch?: ImportantRoadStretchSectionAPI[];
};

/**
 * Lat/lon point used in guidance instructions (different from the GeoJSON used elsewhere).
 * @ignore
 */
export type LatLonPointAPI = {
    latitude: number;
    longitude: number;
};

/**
 * A point on the route path.
 * @ignore
 */
export type RoutePathPointAPI = {
    point: LatLonPointAPI;
    distanceFromRouteStartInMeters: number;
    travelTimeFromRouteStartInSeconds: number;
};

/**
 * Text with phonetics. `phonetic` is a flat string, already transcribed in the alphabet the
 * request asked for via `instructionPhonetics` — there is no per-alphabet object to choose from.
 * @ignore
 */
export type TextWithPhoneticsAPI = { text: string; phonetic?: string; phoneticLanguageCode?: string };

/**
 * Icon reference — same shape as the SDK's RoadShieldReference.
 * @ignore
 */
export type IconReferenceAPI = { reference: string; shieldContent?: string; affixes?: string[] };

/**
 * Road shield inside an instruction's road information. `iconReference` is EXPLICIT.
 * @ignore
 */
export type InstructionRoadShieldAPI = {
    roadNumber?: TextWithPhoneticsAPI;
    countryCodeIso2?: string;
    countrySubdivisionCodeIso?: string;
    iconReference?: IconReferenceAPI;
};

/**
 * Side road. `side` is lowercase on the wire, mapped to the SDK's UPPER_SNAKE `SideRoadSide`.
 * @ignore
 */
export type SideRoadAPI = {
    side: string;
    offsetFromManeuverInMeters: number;
    isDrivable?: boolean;
};

/**
 * Maneuver view. Both angle fields are relative-direction strings (`slightLeft`, `back`, …),
 * not degrees, and are mapped to the SDK's UPPER_SNAKE `ManeuverAngle`.
 * @ignore
 */
export type ManeuverViewAPI = {
    onRouteAngle?: string;
    offRouteAngles?: string[];
};

/**
 * Road information inside an instruction.
 * @ignore
 */
export type InstructionRoadInformationAPI = {
    properties?: string[];
    roadShields?: InstructionRoadShieldAPI[];
    roadNames?: Array<{ identifier: TextWithPhoneticsAPI; source?: string }>;
    roadNumbers?: Array<{ identifier: TextWithPhoneticsAPI; source?: string }>;
    countryCodeIso2?: string;
};

/**
 * Signpost. Carries an EXPLICIT `exitIconReference`, mapped to signpostRoadShieldReferences.
 * @ignore
 */
export type SignpostAPI = {
    exitName?: TextWithPhoneticsAPI;
    exitNumber?: TextWithPhoneticsAPI;
    towardName?: TextWithPhoneticsAPI;
    exitIconReference?: IconReferenceAPI;
};

/**
 * Instruction — raw response shape. Coordinates are lat/lon (not GeoJSON), and several field
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
    sideRoads?: SideRoadAPI[];
    /** Generated, localised instruction text. Present on every instruction. */
    message?: string;
    maneuverView?: ManeuverViewAPI;
    roundaboutType?: string;
};

/**
 * Progress point. Its field names differ from the SDK's RouteProgressPoint.
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
