import type { Feature, FeatureCollection, LineString, Point } from 'geojson';

/**
 * Severity of the traffic delay.
 *
 * @remarks
 * - `unknown`: Delay magnitude cannot be determined
 * - `minor`: Small delay (few minutes)
 * - `moderate`: Noticeable delay (several minutes to ~10 minutes)
 * - `major`: Significant delay (10+ minutes)
 * - `indefinite`: Unknown or extremely long delay (e.g., road closure)
 *
 * @group Traffic
 */
export type DelayMagnitude = 'unknown' | 'minor' | 'moderate' | 'major' | 'indefinite';

/**
 * All possible traffic incident categories.
 * @group Traffic
 */
export const trafficIncidentCategories = [
    'accident',
    'animals-on-road',
    'broken-down-vehicle',
    'danger',
    'flooding',
    'fog',
    'frost',
    'jam',
    'lane-closed',
    'narrow-lanes',
    'other',
    'rain',
    'road-closed',
    'roadworks',
    'wind',
] as const;

/**
 * Simple category classification for traffic incidents.
 *
 * @remarks
 * - `accident`: Traffic accident or collision
 * - `animals-on-road`: Animals present on the road
 * - `broken-down-vehicle`: Vehicle breakdown causing obstruction
 * - `danger`: Dangerous situation on the road
 * - `flooding`: Flooded road section
 * - `fog`: Fog reducing visibility
 * - `frost`: Frost or ice on the road
 * - `jam`: Traffic congestion or slow-moving traffic
 * - `lane-closed`: One or more lanes closed
 * - `narrow-lanes`: Lane narrowing reducing road capacity
 * - `other`: Other types of incidents
 * - `rain`: Heavy rain affecting driving conditions
 * - `road-closed`: Road is closed or blocked
 * - `roadworks`: Construction or maintenance work
 * - `wind`: Strong wind conditions affecting traffic
 *
 * @group Traffic
 */
export type TrafficIncidentCategory = (typeof trafficIncidentCategories)[number];

/**
 * Likelihood that an incident will actually occur.
 *
 * @remarks
 * - `certain`: The incident is confirmed and currently active
 * - `probable`: The incident is very likely to be occurring
 * - `risk_of`: There is a risk of this incident occurring
 * - `improbable`: The incident is unlikely to be occurring
 *
 * @group Traffic
 */
export type TrafficIncidentProbability = 'certain' | 'probable' | 'risk_of' | 'improbable';

/**
 * Whether a traffic incident is currently active or anticipated in the future.
 *
 * @remarks
 * - `present`: The incident is currently active
 * - `future`: The incident is scheduled or predicted to occur in the future
 *
 * @group Traffic
 */
export type TrafficIncidentTimeValidity = 'present' | 'future';

/**
 * A single TMC (Traffic Message Channel) location point.
 *
 * @group Traffic
 */
export type TrafficIncidentTMCPoint = {
    /**
     * TMC location code.
     */
    location: number;
    /**
     * Offset from the TMC location in the direction of the incident.
     */
    offset?: number;
};

/**
 * Traffic Message Channel (TMC) data associated with a traffic incident.
 *
 * TMC is an international standard for encoding traffic and travel information
 * in FM radio broadcasts (RDS-TMC) and digital data streams.
 *
 * @group Traffic
 */
export type TrafficIncidentTMC = {
    /**
     * ISO 3166-1 alpha-2 country code.
     */
    countryCode: string;
    /**
     * TMC table number.
     */
    tableNumber: string;
    /**
     * TMC table version.
     */
    tableVersion: string;
    /**
     * Direction of the incident along the TMC path.
     */
    direction: 'positive' | 'negative';
    /**
     * Ordered list of TMC location points describing the incident extent.
     */
    points: TrafficIncidentTMCPoint[];
};

/**
 * A single event contributing to a traffic incident.
 *
 * Incidents may have one or more events describing different aspects of the situation.
 *
 * @group Traffic
 */
export type TrafficIncidentEvent = {
    /**
     * Human-readable description of the event.
     */
    description: string;
    /**
     * Numeric event code.
     */
    code: number;
    /**
     * Category of this specific event.
     */
    category: TrafficIncidentCategory;
};

/**
 * Properties common to all traffic incident representations.
 *
 * @remarks
 * Shared between the Incident Details service response and map vector-tile features.
 *
 * @group Traffic
 */
export type TrafficIncidentBaseProperties = {
    /**
     * Unique identifier of the incident.
     */
    id: string;
    /**
     * Primary category of the incident.
     */
    category: TrafficIncidentCategory;
    /**
     * Severity of the delay caused by this incident.
     */
    magnitudeOfDelay: DelayMagnitude;
    /**
     * Estimated delay caused by the incident in seconds.
     */
    delayInSeconds?: number;
    /**
     * Time when the incident started or is expected to start.
     */
    startTime?: Date;
    /**
     * Time when the incident ended or is expected to end.
     */
    endTime?: Date;
    /**
     * Confidence in the occurrence of the incident.
     */
    probabilityOfOccurrence?: TrafficIncidentProbability;
    /**
     * Number of user reports that contributed to this incident.
     */
    numberOfReports?: number;
    /**
     * Time of the most recent user report for this incident.
     */
    lastReportTime?: Date;
};

/**
 * Full properties of a traffic incident from the Incident Details service.
 *
 * Extends {@link TrafficIncidentBaseProperties} with fields available in the
 * Incident Details API response but not in map vector-tile features.
 *
 * @group Traffic
 */
export type TrafficIncidentProperties = TrafficIncidentBaseProperties & {
    /**
     * One or more events describing the incident in detail.
     */
    events: TrafficIncidentEvent[];
    /**
     * Human-readable description of the start of the affected road.
     */
    from?: string;
    /**
     * Human-readable description of the end of the affected road.
     */
    to?: string;
    /**
     * Length of the affected road section in meters.
     */
    lengthInMeters?: number;
    /**
     * Road numbers (e.g. highway designations) affected by the incident.
     */
    roadNumbers?: string[];
    /**
     * Whether the incident is currently active or expected in the future.
     */
    timeValidity: TrafficIncidentTimeValidity;
    /**
     * TMC data for the incident, if available.
     */
    tmc?: TrafficIncidentTMC;
};

/**
 * A GeoJSON Feature representing a single traffic incident.
 *
 * The geometry is a `Point` for localised incidents or a `LineString`
 * for incidents that span a stretch of road.
 *
 * @group Traffic
 */
export type TrafficIncident = Feature<Point | LineString, TrafficIncidentProperties>;

/**
 * Response from the Incident Details service.
 *
 * Extends the GeoJSON `FeatureCollection` standard, where each feature
 * is a {@link TrafficIncident}.
 *
 * @group Traffic
 */
export type TrafficIncidentDetails = FeatureCollection<Point | LineString, TrafficIncidentProperties>;
