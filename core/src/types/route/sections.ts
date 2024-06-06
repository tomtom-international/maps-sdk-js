import type { LegSummary } from "./summary";
import type { RoadShieldReference } from "./guidance";

/**
 * Base type for all route section properties.
 * @group Route
 * @category Types
 */
export type SectionProps = {
    /**
     * Random generated id.
     */
    id: string;
    /**
     * The route path point index where this section starts.
     */
    startPointIndex: number;
    /**
     * The (inclusive) route path point index where this section ends.
     */
    endPointIndex: number;
    /**
     * The start time of this section, in seconds since departure.
     */
    startTravelTimeInSeconds?: number;
    /**
     * The end time of this section, in seconds since departure.
     */
    endTravelTimeInSeconds?: number;
    /**
     * The duration in seconds through this section.
     * * It is simply the difference between endTravelTimeSeconds and startTravelTimeSeconds.
     */
    durationInSeconds?: number;
    /**
     * The length or distance in meters since departure at the start of this section.
     */
    startLengthInMeters?: number;
    /**
     * The length or distance in meters since departure at the end of this section.
     */
    endLengthInMeters?: number;
    /**
     * The length or distance in meters along this section.
     * * It is simply the difference between endDistanceMeters and startDistanceMeters.
     */
    lengthInMeters?: number;
};

/**
 * Represents a route section passing through a specific country.
 * @group Route
 * @category Types
 */
export type CountrySectionProps = SectionProps & {
    /**
     * It provides the 3-character {@link https://gist.github.com/tadast/8827699 ISO 3166-1 alpha-3} country code in which the section is located.
     */
    countryCodeISO3: string;
};

/**
 * The simple category for the traffic incident
 * @group Route
 * @category Types
 */
export type TrafficCategory = "jam" | "road_work" | "road_closure" | "other";

/**
 * The magnitude of the delay for the traffic incident.
 * @group Route
 * @category Types
 */
export type DelayMagnitude = "unknown" | "minor" | "moderate" | "major" | "indefinite";

/**
 * Describes what caused a traffic incident, based on TPEG2-TEC standard.
 * @group Route
 * @category Types
 */
export type CauseTEC = {
    /**
     * Main cause code for traffic incident based on TPEG2-TEC standard.
     */
    mainCauseCode: number;
    /**
     * Optional sub cause code for traffic incident based on TPEG2-TEC standard.
     */
    subCauseCode?: number;
};

/**
 * Describes Tec information about this traffic incident based on TPEG2-TEC standard
 * @group Route
 * @category Types
 */
export type TrafficIncidentTEC = {
    /**
     * The effect on the traffic flow. For traffic incident based on TPEG2-TEC standard.
     */
    effectCode: number;
    /**
     *  List of cause elements that caused problems in traffic. For traffic incident based on TPEG2-TEC standard
     */
    causes?: [CauseTEC, ...CauseTEC[]];
};

/**
 * Section representing a traffic incident.
 * @group Route
 * @category Types
 */
export type TrafficSectionProps = SectionProps & {
    /**
     * The simple category for the traffic incident.
     */
    simpleCategory: TrafficCategory;
    /**
     * The magnitude of the delay for the traffic incident.
     */
    magnitudeOfDelay: DelayMagnitude;
    /**
     * Tec information about this traffic incident based on TPEG2-TEC standard.
     */
    tec: TrafficIncidentTEC;
    /**
     * The effective speed in KM/H through this traffic incident, if known.
     */
    effectiveSpeedInKmh?: number;
    /**
     * The delay in seconds for this traffic incident, if known.
     */
    delayInSeconds?: number;
};

/**
 * Section representing a route leg, which is the portion of the path between two regular (non-circle) waypoints.
 * - An A-B route contains 1 leg (A-B).
 * - An A-B-C route contains 2 legs (A-B, B-C).
 * - An A-B-x-C route, where x is a circle waypoint, also contains 2 legs (A-B, B-C).
 * @group Route
 * @category Types
 */
export type LegSectionProps = Omit<SectionProps, "startPointIndex" | "endPointIndex"> & {
    /**
     * The route path point index where this section starts. Only available if the route polyline is also available.
     */
    startPointIndex?: number;
    /**
     * The route path point index where this section ends. Only available if the route polyline is also available.
     */
    endPointIndex?: number;
    /**
     * Summary information for this specific leg.
     * TODO EDXCE-274: bring this at the base level instead of nested object? And then align on common fields with SectionProps
     */
    summary: LegSummary;
};

/**
 * All the possible lane directions.
 * @group Route
 * @category Types
 */
export type PossibleLaneDirection =
    | "STRAIGHT"
    | "SLIGHT_RIGHT"
    | "RIGHT"
    | "SHARP_RIGHT"
    | "RIGHT_U_TURN"
    | "SLIGHT_LEFT"
    | "LEFT"
    | "SHARP_LEFT"
    | "LEFT_U_TURN";

/**
 * Lane direction object, containing the possible directions for a lane and the follow direction.
 * @group Route
 * @category Types
 */
export type LaneDirection = {
    /**
     * The possible directions for this lane.
     */
    directions: PossibleLaneDirection[];
    /**
     * The direction to follow for this lane.
     */
    follow?: PossibleLaneDirection;
};

/**
 * All the possible lane separators.
 * @group Route
 * @category Types
 */
export type PossibleLaneSeparator =
    | "UNKNOWN"
    | "NO_MARKING"
    | "LONG_DASHED"
    | "DOUBLE_SOLID"
    | "SINGLE_SOLID"
    | "SOLID_DASHED"
    | "DASHED_SOLID"
    | "SHORT_DASHED"
    | "SHADED_AREA_MARKING"
    | "DASHED_BLOCKS"
    | "DOUBLE_DASHED"
    | "CROSSING_ALERT"
    | "PHYSICAL_DIVIDER"
    | "PHYSICAL_DIVIDER_LESS_THAN_3M"
    | "PHYSICAL_DIVIDER_GUARDRAIL"
    | "CURB";
/**
 * Section representing a lane configuration.
 * @group Route
 * @category Types
 */
export type LaneSectionProps = SectionProps & {
    /**
     * The lane directions for this lane section.
     */
    lanes: LaneDirection[];
    /**
     * The lane separators for this lane section.
     */
    laneSeparators: PossibleLaneSeparator[];
    /**
     * Properties of the lane section, as a possible combination of several values. This field is optional.
     * Possible values:
     * IS_MANEUVER: whether the lane section contains a maneuver point, that is, there exists a guidance instruction
     * with a maneuverPoint that falls into this section. The section describes the lane configuration for that
     * particular instruction.
     * It is possible that more values will be added to the API in the future.
     */
    properties?: string[];
};

/**
 * Section representing a speed limit.
 * @group Route
 * @category Types
 */
export type SpeedLimitSectionProps = SectionProps & {
    /**
     * The speed limit in km/h for this section.
     */
    maxSpeedLimitInKmh: number;
};

/**
 * Section representing a road shield.
 * @group Route
 * @category Types
 */
export type RoadShieldSectionProps = SectionProps & {
    /**
     * The road shield code for this section.
     */
    roadShieldReferences: RoadShieldReference[];
};

/**
 * Route sections are parts of the planned route that have specific characteristics,
 * such as ones on a ferry or motorway, or sections with traffic incidents in them.
 * Using sections, you can show users where these things lie on a planned route.
 * @group Route
 * @category Types
 */
export type SectionsProps = {
    leg: LegSectionProps[];
    carTrain?: SectionProps[];
    ferry?: SectionProps[];
    motorway?: SectionProps[];
    pedestrian?: SectionProps[];
    toll?: SectionProps[];
    tollVignette?: CountrySectionProps[];
    country?: CountrySectionProps[];
    traffic?: TrafficSectionProps[];
    vehicleRestricted?: SectionProps[];
    tunnel?: SectionProps[];
    unpaved?: SectionProps[];
    urban?: SectionProps[];
    carpool?: SectionProps[];
    lowEmissionZone?: SectionProps[];
    lanes?: LaneSectionProps[];
    roadShields?: RoadShieldSectionProps[];
    speedLimit?: SpeedLimitSectionProps[];
};

/**
 * @group Route
 * @category Types
 */
export type SectionType = keyof SectionsProps;

/**
 * Route calculation request section types so they can be included in response.
 * @group Route
 * @category Variables
 */
export const inputSectionTypes: SectionType[] = [
    "carTrain",
    "ferry",
    "tunnel",
    "motorway",
    "pedestrian",
    "toll",
    "tollVignette",
    "country",
    "vehicleRestricted",
    "traffic",
    "carpool",
    "urban",
    "unpaved",
    "lowEmissionZone",
    "speedLimit",
    "roadShields"
] as const;

/**
 * Route calculation request section types, including guidance-related ones, so they can be included in response.
 * @group Route
 * @category Variables
 */
export const inputSectionTypesWithGuidance: SectionType[] = [...inputSectionTypes, "lanes"] as const;

/**
 * @group Route
 * @category Variables
 */
export const sectionTypes: SectionType[] = [...inputSectionTypesWithGuidance, "leg"] as const;
