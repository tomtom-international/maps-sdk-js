import {
    AreaAnalyticsAnomaly,
    AreaAnalyticsFeature,
    AreaAnalyticsFeatureProperties,
    AreaAnalyticsMetricKey,
    AreaAnalyticsMetricRange,
    AreaAnalyticsMetrics,
    AreaAnalyticsTileEntry,
    AreaAnalyticsTimedData,
    AreaAnalyticsTimedEntry,
    areaAnalyticsMetricKeys,
    BBox,
    bboxFromGeoJSON,
    TrafficAreaAnalytics,
} from '@tomtom-org/maps-sdk/core';
import type {
    AnomalyAPI,
    AreaAnalyticsFeatureAPI,
    AreaAnalyticsResponseAPI,
    FeaturePropertiesAPI,
    MetricsAPI,
    TiledEntryAPI,
    TimedEntryAPI,
} from './types/apiTypes';

const parseMetrics = (api: MetricsAPI): AreaAnalyticsMetrics => ({
    ...(api.v !== undefined && { speed: api.v }),
    ...(api.fv !== undefined && { freeFlowSpeed: api.fv }),
    ...(api.c !== undefined && { congestionLevel: api.c }),
    ...(api.t !== undefined && { travelTime: api.t }),
    ...(api.l !== undefined && { networkLength: api.l }),
});

const parseTimedEntry = (entry: TimedEntryAPI): AreaAnalyticsTimedEntry => ({
    ...(entry.date !== undefined && { date: new Date(entry.date) }),
    ...(entry.year !== undefined && { year: entry.year }),
    ...(entry.month !== undefined && { month: entry.month }),
    ...(entry.week !== undefined && { week: entry.week }),
    ...(entry.hour !== undefined && { hour: entry.hour }),
    ...(entry.day !== undefined && { day: entry.day }),
    ...parseMetrics(entry),
});

/**
 * Adds a given number of days to a Date, returning a new Date (no mutation).
 */
const addDays = (base: Date, days: number): Date => {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d;
};

/**
 * Parses hourly entries (sequential, 24 per day) and computes `date` + `hour`
 * from the sequential index when the API doesn't provide them.
 */
const parseHourlyEntries = (entries: TimedEntryAPI[], startDate: Date): AreaAnalyticsTimedEntry[] =>
    entries.map((entry, index) => {
        const base = parseTimedEntry(entry);
        // Only compute if the API didn't already provide the fields
        if (base.date === undefined) {
            base.date = addDays(startDate, Math.floor(index / 24));
        }
        if (base.hour === undefined) {
            base.hour = index % 24;
        }
        return base;
    });

/**
 * Parses daily entries (sequential, one per day) and computes `date`
 * from the sequential index when the API doesn't provide it.
 */
const parseDailyEntries = (entries: TimedEntryAPI[], startDate: Date): AreaAnalyticsTimedEntry[] =>
    entries.map((entry, index) => {
        const base = parseTimedEntry(entry);
        if (base.date === undefined) {
            base.date = addDays(startDate, index);
        }
        return base;
    });

/**
 * Parses average entries (sequential, 24 per day-of-week, 7 days) and computes
 * `day` (1=Monday…7=Sunday) + `hour` from the sequential index when the API
 * doesn't provide them.
 */
const parseAverageEntries = (entries: TimedEntryAPI[]): AreaAnalyticsTimedEntry[] =>
    entries.map((entry, index) => {
        const base = parseTimedEntry(entry);
        if (base.day === undefined) {
            base.day = Math.floor(index / 24) + 1; // 1 = Monday … 7 = Sunday
        }
        if (base.hour === undefined) {
            base.hour = index % 24;
        }
        return base;
    });

const parseTileEntry = (tile: TiledEntryAPI): AreaAnalyticsTileEntry => ({
    tileCentre: [tile.lon, tile.lat],
    ...parseMetrics(tile),
});

const parseAnomaly = (api: AnomalyAPI): AreaAnalyticsAnomaly => ({
    startDate: new Date(api.startDate),
    endDate: new Date(api.endDate),
    labels: api.labels,
});

const parseTimedData = (api: FeaturePropertiesAPI['timedData'], startDate: Date): AreaAnalyticsTimedData => ({
    ...(api.yearly && { yearly: api.yearly.map(parseTimedEntry) }),
    ...(api.monthly && { monthly: api.monthly.map(parseTimedEntry) }),
    ...(api.weekly && { weekly: api.weekly.map(parseTimedEntry) }),
    ...(api.daily && { daily: parseDailyEntries(api.daily, startDate) }),
    ...(api.hourly && { hourly: parseHourlyEntries(api.hourly, startDate) }),
    ...(api.average && { average: parseAverageEntries(api.average) }),
});

const API_DATA_TYPE_TO_METRIC_KEY: Record<string, AreaAnalyticsMetricKey> = {
    SPEED: 'speed',
    FREE_FLOW_SPEED: 'freeFlowSpeed',
    CONGESTION_LEVEL: 'congestionLevel',
    TRAVEL_TIME: 'travelTime',
    NETWORK_LENGTH: 'networkLength',
};

const parseAnomalies = (
    api: Record<string, AnomalyAPI[]>,
): Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsAnomaly[]>> => {
    const result: Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsAnomaly[]>> = {};
    for (const [key, anomalies] of Object.entries(api)) {
        const metricKey = API_DATA_TYPE_TO_METRIC_KEY[key];
        if (metricKey) result[metricKey] = anomalies.map(parseAnomaly);
    }
    return result;
};

const parseFeatureProperties = (api: FeaturePropertiesAPI, startDate: Date): AreaAnalyticsFeatureProperties => ({
    name: api.name,
    timezone: api.timezone,
    level: api.level,
    baseData: parseMetrics(api.baseData),
    timedData: parseTimedData(api.timedData, startDate),
    ...(api.tiledData && {
        tiledData: { tiles: api.tiledData.tiles.map(parseTileEntry) },
    }),
    ...(api.anomalies && {
        anomalies: parseAnomalies(api.anomalies),
    }),
});

const parseFeature = (apiFeature: AreaAnalyticsFeatureAPI, startDate: Date): AreaAnalyticsFeature => ({
    type: apiFeature.type,
    id: apiFeature.id,
    geometry: apiFeature.geometry,
    properties: parseFeatureProperties(apiFeature.properties, startDate),
    bbox: bboxFromGeoJSON(apiFeature.geometry) as BBox,
});

const computeTileRanges = (
    features: AreaAnalyticsFeature[],
): Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsMetricRange>> => {
    const tiles = features.flatMap((f) => f.properties.tiledData?.tiles ?? []);
    const ranges: Partial<Record<AreaAnalyticsMetricKey, AreaAnalyticsMetricRange>> = {};
    for (const key of areaAnalyticsMetricKeys) {
        const values = tiles.map((t) => t[key]).filter((v): v is number => v != null);
        if (values.length > 0) {
            ranges[key] = { min: Math.min(...values), max: Math.max(...values) };
        }
    }
    return ranges;
};

/**
 * Parses a raw Traffic Area Analytics API response into the SDK representation.
 *
 * In addition to renaming abbreviated metric fields and converting date strings
 * to `Date` objects, this function computes data-driven min/max ranges from
 * all tile entries across every feature and attaches them to
 * `result.properties.ranges`.
 *
 * @param apiResponse - The raw Area Analytics API response.
 */
export const parseTrafficAreaAnalyticsResponse = (apiResponse: AreaAnalyticsResponseAPI): TrafficAreaAnalytics => {
    const startDate = new Date(apiResponse.properties.startDate);
    const features = apiResponse.features.map((f) => parseFeature(f, startDate));

    return {
        type: 'FeatureCollection',
        properties: {
            startDate,
            endDate: new Date(apiResponse.properties.endDate),
            metrics: apiResponse.properties.dataTypes
                .map((dt) => API_DATA_TYPE_TO_METRIC_KEY[dt])
                .filter((key): key is AreaAnalyticsMetricKey => key !== undefined),
            heatmap: apiResponse.properties.heatmap,
            frcs: apiResponse.properties.frcs,
            ranges: computeTileRanges(features),
        },
        features,
    };
};
