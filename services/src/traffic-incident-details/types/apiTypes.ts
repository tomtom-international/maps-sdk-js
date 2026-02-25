import { LineString, Point } from 'geojson';

/**
 * @ignore
 */
export type IncidentTMCPointAPI = {
    location: number;
    offset?: number;
};

/**
 * @ignore
 */
export type IncidentTMCAPI = {
    countryCode: string;
    tableNumber: string;
    tableVersion: string;
    direction: string;
    points: IncidentTMCPointAPI[];
};

/**
 * @ignore
 */
export type IncidentEventAPI = {
    description: string;
    code: number;
    iconCategory: number;
};

/**
 * @ignore
 */
export type IncidentPropertiesAPI = {
    id: string;
    iconCategory: number;
    magnitudeOfDelay: number;
    events: IncidentEventAPI[];
    startTime?: string;
    endTime?: string;
    from?: string;
    to?: string;
    length?: number;
    delay?: number;
    roadNumbers?: string[];
    timeValidity: string;
    probabilityOfOccurrence?: string;
    numberOfReports?: number;
    lastReportTime?: string;
    tmc?: IncidentTMCAPI;
};

/**
 * @ignore
 */
export type IncidentGeometryAPI = Point | LineString;

/**
 * @ignore
 */
export type IncidentAPI = {
    type: 'Feature';
    geometry: IncidentGeometryAPI;
    properties: IncidentPropertiesAPI;
};

/**
 * @ignore
 */
export type IncidentDetailsResponseAPI = {
    incidents: (IncidentAPI | null)[];
};
