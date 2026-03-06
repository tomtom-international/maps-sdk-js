import type { MultiPolygon, Polygon } from 'geojson';

/**
 * @ignore
 * Abbreviated metric fields as returned by the Area Analytics API.
 */
export type MetricsAPI = {
    v?: number;
    fv?: number;
    c?: number;
    t?: number;
    l?: number;
};

/**
 * @ignore
 */
export type TimedEntryAPI = MetricsAPI & {
    date?: string;
    year?: number;
    month?: number;
    week?: number;
    hour?: number;
    day?: number;
};

/**
 * @ignore
 */
export type TiledEntryAPI = MetricsAPI & {
    lat: number;
    lon: number;
};

/**
 * @ignore
 */
export type AnomalyAPI = {
    startDate: string;
    endDate: string;
    labels: string[];
};

/**
 * @ignore
 */
export type FeaturePropertiesAPI = {
    name: string;
    timezone: string;
    level: number;
    baseData: MetricsAPI;
    timedData: {
        yearly?: TimedEntryAPI[];
        monthly?: TimedEntryAPI[];
        weekly?: TimedEntryAPI[];
        daily?: TimedEntryAPI[];
        hourly?: TimedEntryAPI[];
        average?: TimedEntryAPI[];
    };
    tiledData?: {
        tiles: TiledEntryAPI[];
    };
    anomalies?: Record<string, AnomalyAPI[]>;
};

/**
 * @ignore
 */
export type AreaAnalyticsFeatureAPI = {
    type: 'Feature';
    id: string;
    geometry: Polygon;
    properties: FeaturePropertiesAPI;
};

/**
 * @ignore
 */
export type AreaAnalyticsCollectionPropertiesAPI = {
    startDate: string;
    endDate: string;
    dataTypes: string[];
    heatmap: boolean;
    frcs: number[];
};

/**
 * @ignore
 */
export type AreaAnalyticsResponseAPI = {
    type: 'FeatureCollection';
    properties: AreaAnalyticsCollectionPropertiesAPI;
    features: AreaAnalyticsFeatureAPI[];
};

/**
 * @ignore
 */
export type AreaAnalyticsRequestBodyFeature = {
    type: 'Feature';
    properties?: { name?: string; timezone?: string };
    geometry: Polygon | MultiPolygon;
};

/**
 * @ignore
 */
export type AreaAnalyticsRequestBody = {
    name?: string;
    /** Continuous range start — mutually exclusive with `days`. */
    startDate?: string;
    /** Continuous range end — mutually exclusive with `days`. */
    endDate?: string;
    /** Specific dates — mutually exclusive with `startDate`/`endDate`. */
    days?: string[];
    dataTypes: string[];
    frcs: number[];
    hours: number[];
    features: AreaAnalyticsRequestBodyFeature[];
};
