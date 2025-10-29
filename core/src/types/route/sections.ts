import type { RoadShieldReference } from './guidance';
import type { LegSummary } from './summary';

/**
 * Base properties for all route sections.
 *
 * Sections divide a route into portions with specific characteristics or attributes.
 * All section types extend this base with additional specialized properties.
 *
 * @group Route
 */
export type SectionProps = {
    /**
     * Unique identifier for this section.
     *
     * Randomly generated to distinguish between sections.
     */
    id: string;
    /**
     * Index of the route coordinate where this section begins.
     *
     * Zero-based index into the route's LineString coordinates array.
     */
    startPointIndex: number;
    /**
     * Index of the route coordinate where this section ends (inclusive).
     *
     * Zero-based index into the route's LineString coordinates array.
     */
    endPointIndex: number;
    /**
     * Elapsed time in seconds from route start to the beginning of this section.
     */
    startTravelTimeInSeconds?: number;
    /**
     * Elapsed time in seconds from route start to the end of this section.
     */
    endTravelTimeInSeconds?: number;
    /**
     * Duration in seconds to traverse this section.
     *
     * Calculated as: endTravelTimeInSeconds - startTravelTimeInSeconds
     */
    durationInSeconds?: number;
    /**
     * Cumulative distance in meters from route start to the beginning of this section.
     */
    startLengthInMeters?: number;
    /**
     * Cumulative distance in meters from route start to the end of this section.
     */
    endLengthInMeters?: number;
    /**
     * Length in meters of this section.
     *
     * Calculated as: endLengthInMeters - startLengthInMeters
     */
    lengthInMeters?: number;
};

/**
 * Route section representing passage through a country.
 *
 * Used to identify which countries the route traverses, useful for:
 * - Border crossing planning
 * - International routing costs
 * - Regulatory requirements
 *
 * @example
 * ```typescript
 * const countrySection: CountrySectionProps = {
 *   id: 'country-section-1',
 *   startPointIndex: 0,
 *   endPointIndex: 150,
 *   countryCodeISO3: 'NLD',  // Netherlands
 *   lengthInMeters: 25000
 * };
 * ```
 *
 * @group Route
 */
export type CountrySectionProps = SectionProps & {
    /**
     * Three-letter ISO 3166-1 alpha-3 country code.
     *
     * Examples: 'USA', 'GBR', 'NLD', 'DEU', 'FRA'
     *
     * @see [ISO 3166-1 alpha-3 codes](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
     */
    countryCodeISO3: string;
};

/**
 * Sections with important stretches of road information.
 *
 * * It provides a set of street names and/or a set of road numbers that allow the driver to identify and distinguish the course of the route (from other potential routes).
 *
 * @group Route
 */
export type ImportantRoadStretchProps = SectionProps & {
    /**
     * The integer value of importance. The index starts from 0, and a lower value means higher importance. The index is needed for two reasons:
     * * To understand which stretch is the most important (for example, if it is necessary to display a smaller number of stretches).
     * * To group different sections that belong to the same stretch (since there may be gaps in one stretch for various reasons).
     */
    index: number;
    /**
     * The street name of the important road stretch.
     */
    streetName?: string;
    /**
     * A set of road numbers that identify the important road stretch.
     *
     * @remarks
     * The road numbers are sorted in descending order of display priority.
     */
    roadNumbers?: string[];
};

/**
 * Simple category classification for traffic incidents.
 *
 * @remarks
 * - `jam`: Traffic congestion or slow-moving traffic
 * - `road_work`: Construction or maintenance work
 * - `road_closure`: Road is closed or blocked
 * - `other`: Other types of incidents
 *
 * @group Route
 */
export type TrafficCategory = 'jam' | 'road_work' | 'road_closure' | 'other';

/**
 * Severity of the traffic delay.
 *
 * @remarks
 * - `unknown`: Delay magnitude cannot be determined
 * - `minor`: Small delay (few minutes)
 * - `moderate`: Noticeable delay (several minutes to ~15 minutes)
 * - `major`: Significant delay (15+ minutes)
 * - `indefinite`: Unknown or extremely long delay (e.g., road closure)
 *
 * @group Route
 */
export type DelayMagnitude = 'unknown' | 'minor' | 'moderate' | 'major' | 'indefinite';

/**
 * Traffic incident cause based on TPEG2-TEC standard.
 *
 * TPEG (Transport Protocol Experts Group) codes provide standardized
 * classification of traffic incident causes.
 *
 * @see [TPEG2-TEC Standard](https://www.iso.org/standard/59231.html)
 *
 * @group Route
 */
export type CauseTEC = {
    /**
     * Main cause code from TPEG2-TEC standard.
     *
     * Primary classification of what caused the incident.
     */
    mainCauseCode: number;
    /**
     * Optional sub-cause code from TPEG2-TEC standard.
     *
     * More specific classification under the main cause.
     */
    subCauseCode?: number;
};

/**
 * Traffic incident information based on TPEG2-TEC standard.
 *
 * Provides standardized classification of traffic flow effects and causes.
 *
 * @group Route
 */
export type TrafficIncidentTEC = {
    /**
     * Effect code describing impact on traffic flow.
     *
     * TPEG2-TEC standard code indicating how traffic is affected.
     */
    effectCode: number;
    /**
     * List of causes for this traffic incident.
     *
     * Array of cause elements with at least one entry. Multiple causes
     * may contribute to a single traffic incident.
     */
    causes?: [CauseTEC, ...CauseTEC[]];
};

/**
 * Route section affected by a traffic incident.
 *
 * Represents a portion of the route experiencing traffic delays due to
 * congestion, accidents, construction, or other incidents.
 *
 * @example
 * ```typescript
 * const trafficSection: TrafficSectionProps = {
 *   id: 'traffic-1',
 *   startPointIndex: 50,
 *   endPointIndex: 75,
 *   simpleCategory: 'jam',
 *   magnitudeOfDelay: 'moderate',
 *   delayInSeconds: 420,  // 7 minutes
 *   effectiveSpeedInKmh: 25,
 *   tec: { effectCode: 1, causes: [{ mainCauseCode: 101 }] }
 * };
 * ```
 *
 * @group Route
 */
export type TrafficSectionProps = SectionProps & {
    /**
     * Simple category classification of the incident.
     */
    simpleCategory: TrafficCategory;
    /**
     * Severity level of the delay caused by this incident.
     */
    magnitudeOfDelay: DelayMagnitude;
    /**
     * TPEG2-TEC standardized incident information.
     *
     * Provides internationally standardized codes for traffic incident classification.
     */
    tec: TrafficIncidentTEC;
    /**
     * Actual average speed through this incident in km/h.
     *
     * Present when speed information is available. Lower speeds indicate worse congestion.
     */
    effectiveSpeedInKmh?: number;
    /**
     * Additional delay in seconds caused by this incident.
     *
     * Extra time compared to free-flow conditions. Present when delay can be calculated.
     */
    delayInSeconds?: number;
};

/**
 * Route section representing a leg between waypoints.
 *
 * A leg is the portion of route between two consecutive non-circle waypoints.
 * This is a top-level section that encompasses the entire journey segment.
 *
 * @remarks
 * Leg examples:
 * - A→B route: 1 leg (A to B)
 * - A→B→C route: 2 legs (A to B, then B to C)
 * - A→B→(circle)→C route: 2 legs (A to B, then B to C) - circle waypoint doesn't create a leg
 *
 * @example
 * ```typescript
 * const leg: LegSectionProps = {
 *   id: 'leg-1',
 *   summary: {
 *     departureTime: new Date(),
 *     arrivalTime: new Date(),
 *     lengthInMeters: 50000,
 *     travelTimeInSeconds: 3600,
 *     // ... other summary fields
 *   },
 *   startPointIndex: 0,
 *   endPointIndex: 250
 * };
 * ```
 *
 * @group Route
 */
export type LegSectionProps = Omit<SectionProps, 'startPointIndex' | 'endPointIndex'> & {
    /**
     * Index where this leg starts in the route coordinates.
     *
     * Only present if the route polyline geometry is available.
     */
    startPointIndex?: number;
    /**
     * Index where this leg ends in the route coordinates.
     *
     * Only present if the route polyline geometry is available.
     */
    endPointIndex?: number;
    /**
     * Summary statistics for this leg.
     *
     * Contains departure/arrival times, distances, durations, and consumption
     * estimates specifically for this leg of the journey.
     */
    summary: LegSummary;
};

/**
 * Possible directions a lane can lead to.
 *
 * Used in lane guidance to indicate which directions are possible from a lane.
 *
 * @group Route
 */
export type PossibleLaneDirection =
    | 'STRAIGHT'
    | 'SLIGHT_RIGHT'
    | 'RIGHT'
    | 'SHARP_RIGHT'
    | 'RIGHT_U_TURN'
    | 'SLIGHT_LEFT'
    | 'LEFT'
    | 'SHARP_LEFT'
    | 'LEFT_U_TURN';

/**
 * Lane guidance information.
 *
 * Describes possible directions for a lane and which direction to follow.
 * Used for lane-level navigation guidance.
 *
 * @example
 * ```typescript
 * // Left lane allows left turn or straight
 * const laneDirection: LaneDirection = {
 *   directions: ['LEFT', 'STRAIGHT'],
 *   follow: 'LEFT'  // Follow the left turn
 * };
 * ```
 *
 * @group Route
 */
export type LaneDirection = {
    /**
     * All possible directions this lane leads to.
     *
     * A lane may allow multiple directions (e.g., straight and turn).
     */
    directions: PossibleLaneDirection[];
    /**
     * The direction to follow in this lane for the route.
     *
     * Present when guidance indicates which direction to take.
     */
    follow?: PossibleLaneDirection;
};

/**
 * All the possible lane separators.
 * @group Route
 */
export type PossibleLaneSeparator =
    | 'UNKNOWN'
    | 'NO_MARKING'
    | 'LONG_DASHED'
    | 'DOUBLE_SOLID'
    | 'SINGLE_SOLID'
    | 'SOLID_DASHED'
    | 'DASHED_SOLID'
    | 'SHORT_DASHED'
    | 'SHADED_AREA_MARKING'
    | 'DASHED_BLOCKS'
    | 'DOUBLE_DASHED'
    | 'CROSSING_ALERT'
    | 'PHYSICAL_DIVIDER'
    | 'PHYSICAL_DIVIDER_LESS_THAN_3M'
    | 'PHYSICAL_DIVIDER_GUARDRAIL'
    | 'CURB';
/**
 * Section representing a lane configuration.
 * @group Route
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
    importantRoadStretch?: ImportantRoadStretchProps[];
};

/**
 * @group Route
 */
export type SectionType = keyof SectionsProps;

/**
 * Route calculation request section types so they can be included in response.
 * @group Route
 */
export const inputSectionTypes: SectionType[] = [
    'carTrain',
    'ferry',
    'tunnel',
    'motorway',
    'pedestrian',
    'toll',
    'tollVignette',
    'country',
    'vehicleRestricted',
    'traffic',
    'carpool',
    'urban',
    'unpaved',
    'lowEmissionZone',
    'speedLimit',
    'roadShields',
    'importantRoadStretch',
] as const;

/**
 * Route calculation request section types, including guidance-related ones, so they can be included in response.
 * @group Route
 */
export const inputSectionTypesWithGuidance: SectionType[] = [...inputSectionTypes, 'lanes'] as const;

/**
 * @group Route
 */
export const sectionTypes: SectionType[] = [...inputSectionTypesWithGuidance, 'leg'] as const;
