import type {
    AreaAnalyticsAnomaly,
    AreaAnalyticsDataType,
    AreaAnalyticsFeature,
    AreaAnalyticsFeatureProperties,
    AreaAnalyticsMetrics,
    AreaAnalyticsTileEntry,
    AreaAnalyticsTimedData,
    AreaAnalyticsTimedEntry,
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

const parseTileEntry = (tile: TiledEntryAPI): AreaAnalyticsTileEntry => ({
    tileCentre: [tile.lon, tile.lat],
    ...parseMetrics(tile),
});

const parseAnomaly = (api: AnomalyAPI): AreaAnalyticsAnomaly => ({
    startDate: new Date(api.startDate),
    endDate: new Date(api.endDate),
    labels: api.labels,
});

const parseTimedData = (api: FeaturePropertiesAPI['timedData']): AreaAnalyticsTimedData => ({
    ...(api.yearly && { yearly: api.yearly.map(parseTimedEntry) }),
    ...(api.monthly && { monthly: api.monthly.map(parseTimedEntry) }),
    ...(api.weekly && { weekly: api.weekly.map(parseTimedEntry) }),
    ...(api.daily && { daily: api.daily.map(parseTimedEntry) }),
    ...(api.hourly && { hourly: api.hourly.map(parseTimedEntry) }),
    ...(api.average && { average: api.average.map(parseTimedEntry) }),
});

const parseAnomalies = (
    api: Record<string, AnomalyAPI[]>,
): Partial<Record<AreaAnalyticsDataType, AreaAnalyticsAnomaly[]>> => {
    const result: Partial<Record<AreaAnalyticsDataType, AreaAnalyticsAnomaly[]>> = {};
    for (const [key, anomalies] of Object.entries(api)) {
        result[key as AreaAnalyticsDataType] = anomalies.map(parseAnomaly);
    }
    return result;
};

const parseFeatureProperties = (api: FeaturePropertiesAPI): AreaAnalyticsFeatureProperties => ({
    name: api.name,
    timezone: api.timezone,
    level: api.level,
    baseData: parseMetrics(api.baseData),
    timedData: parseTimedData(api.timedData),
    ...(api.tiledData && {
        tiledData: { tiles: api.tiledData.tiles.map(parseTileEntry) },
    }),
    ...(api.anomalies && {
        anomalies: parseAnomalies(api.anomalies),
    }),
});

const parseFeature = (apiFeature: AreaAnalyticsFeatureAPI): AreaAnalyticsFeature => ({
    type: apiFeature.type,
    id: apiFeature.id,
    geometry: apiFeature.geometry,
    properties: parseFeatureProperties(apiFeature.properties),
});

/**
 * Default method for parsing a Traffic Area Analytics API response.
 * @param apiResponse The raw Area Analytics API response.
 */
export const parseTrafficAreaAnalyticsResponse = (apiResponse: AreaAnalyticsResponseAPI): TrafficAreaAnalytics => ({
    type: 'FeatureCollection',
    properties: {
        startDate: new Date(apiResponse.properties.startDate),
        endDate: new Date(apiResponse.properties.endDate),
        dataTypes: apiResponse.properties.dataTypes as AreaAnalyticsDataType[],
        heatmap: apiResponse.properties.heatmap,
        frcs: apiResponse.properties.frcs,
    },
    features: apiResponse.features.map(parseFeature),
});
