import { TravelMode } from "./Route";
import { Summary } from "./Summary";

/**
 * Base type for all route sections.
 */
export type Section = {
    /**
     * The route path point index where this section starts.
     */
    startPointIndex: number;
    /**
     * The route path point index where this section ends.
     */
    endPointIndex: number;
};

/**
 * Represents a route section passing through a specific country.
 */
export type CountrySection = Section & {
    /**
     * It provides the 3-character {@link https://gist.github.com/tadast/8827699 ISO 3166-1 alpha-3} country code in which the section is located.
     */
    countryCodeISO3: string;
};

/**
 * Represents a route section with travel mode. This section type is related to the TravelMode request parameter.
 */
export type TravelModeSection = Section & {
    /**
     * The travel mode for this section.
     */
    travelMode: TravelMode;
};

/**
 * The simple category for the traffic incident
 */
export type TrafficCategory = "JAM" | "ROAD_WORK" | "ROAD_CLOSURE" | "OTHER";

/**
 * The magnitude of the delay for the traffic incident.
 */
export type DelayMagnitude = "UNKNOWN" | "MINOR" | "MODERATE" | "MAJOR" | "UNDEFINED";

/**
 * Describes what caused a traffic incident, based on TPEG2-TEC standard.
 */
export type CauseTEC = {
    /**
     * Main cause code for traffic incident based on TPEG2-TEC standard.
     */
    mainCauseCode?: number;
    /**
     * Sub cause code for traffic incident based on TPEG2-TEC standard.
     */
    subCauseCode?: number;
};

/**
 *  Describes Tec information about this traffic incident based on TPEG2-TEC standard
 */
export type TrafficIncidentTEC = {
    /**
     * The effect on the traffic flow. For traffic incident based on TPEG2-TEC standard.
     */
    effectCode?: number;
    /**
     *  List of cause elements that caused problems in traffic. For traffic incident based on TPEG2-TEC standard
     */
    causes?: CauseTEC[];
};

/**
 * Section representing a traffic incident.
 */
export type TrafficSection = Section & {
    /**
     * The simple category for the traffic incident.
     */
    simpleCategory?: TrafficCategory;
    /**
     * The magnitude of the delay for the traffic incident.
     */
    magnitudeOfDelay?: DelayMagnitude;
    /**
     * The effective speed in KM/H through this traffic incident, if known.
     */
    effectiveSpeedInKmh?: number;
    /**
     * The delay in seconds for this traffic incident, if known.
     */
    delayInSeconds?: number;
    /**
     * Tec information about this traffic incident based on TPEG2-TEC standard.
     */
    tec?: TrafficIncidentTEC[];
};

/**
 * Section representing a route leg, which is the portion of the path between two regular (non-circle) waypoints.
 * - An A-B route contains 1 leg (A-B).
 * - An A-B-C route contains 2 legs (A-B, B-C).
 * - An A-B-x-C route, where x is a circle waypoint, also contains 2 legs (A-B, B-C).
 */
export type LegSection = Omit<Section, "startPointIndex" | "endPointIndex"> & {
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
     */
    summary: Summary;
};

/**
 * Route sections are parts of the planned route that have specific characteristics,
 * such as ones on a ferry or motorway, or sections with traffic incidents in them.
 * Using sections, you can show users where these things lie on a planned route.
 */
export type Sections = {
    leg: LegSection[];
    carTrain?: Section[];
    country?: CountrySection[];
    ferry?: Section[];
    motorway?: Section[];
    pedestrian?: Section[];
    tollRoad?: Section[];
    tollVignette?: CountrySection[];
    traffic?: TrafficSection[];
    travelMode?: TravelModeSection[];
    tunnel?: Section[];
    unpaved?: Section[];
    urban?: Section[];
};

export type SectionType = keyof Sections;

export const inputSectionTypes: SectionType[] = [
    "carTrain",
    "ferry",
    "tunnel",
    "motorway",
    "pedestrian",
    "tollRoad",
    "tollVignette",
    "country",
    "travelMode",
    "traffic",
    "urban",
    "unpaved"
];

export const sectionTypes: SectionType[] = [...inputSectionTypes, "leg"];
