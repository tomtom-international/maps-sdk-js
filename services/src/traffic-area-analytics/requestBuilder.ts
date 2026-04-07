import { areaAnalyticsMetricKeys } from '@tomtom-org/maps-sdk/core';
import type { FetchInput } from '../shared';
import { appendCommonParams } from '../shared/request/requestBuildingUtils';
import type { AreaAnalyticsRequestBody } from './types/apiTypes';
import type {
    AreaAnalyticsDateInput,
    FunctionalRoadClass,
    TrafficAreaAnalyticsParams,
} from './types/trafficAreaAnalyticsParams';
import { functionalRoadClasses, metricKeyToApiDataType } from './types/trafficAreaAnalyticsParams';

const AREA_ANALYTICS_URL_PATH = '/areaanalytics/reports/lite';

const buildUrlBasePath = (params: TrafficAreaAnalyticsParams): string =>
    params.customServiceBaseURL ?? `${params.commonBaseURL}${AREA_ANALYTICS_URL_PATH}`;

const toDateString = (date: AreaAnalyticsDateInput): string =>
    // (ensure to get only YYYY-MM-DD portion of the dates)
    date instanceof Date ? date.toISOString().slice(0, 10) : date;

const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);

const frcToNumber = (frc: FunctionalRoadClass): number => functionalRoadClasses.indexOf(frc);

/**
 * Default method for building a Traffic Area Analytics request from {@link TrafficAreaAnalyticsParams}.
 * @param params The traffic area analytics parameters, with global configuration already merged.
 */
export const buildTrafficAreaAnalyticsRequest = (
    params: TrafficAreaAnalyticsParams,
): FetchInput<AreaAnalyticsRequestBody> => {
    const url = new URL(buildUrlBasePath(params));
    appendCommonParams(url.searchParams, params);

    const daysAgo = (numDays: number): Date => {
        const date = new Date();
        date.setDate(date.getDate() - numDays);
        return date;
    };

    const datePart = Array.isArray(params.days)
        ? { days: params.days.map(toDateString) }
        : {
              startDate: toDateString(params.startDate ?? daysAgo(3)),
              endDate: toDateString(params.endDate ?? daysAgo(2)),
          };

    const body: AreaAnalyticsRequestBody = {
        name: params.name ?? `Maps SDK JS Area Analytics Report ${new Date().toISOString()}`,
        ...datePart,
        dataTypes:
            params.metrics === 'all'
                ? areaAnalyticsMetricKeys.map((k) => metricKeyToApiDataType[k])
                : params.metrics.map((k) => metricKeyToApiDataType[k]),
        frcs:
            params.functionalRoadClasses === 'all'
                ? functionalRoadClasses.map((_, i) => i)
                : params.functionalRoadClasses.map(frcToNumber),
        hours: params.hours === 'all' ? ALL_HOURS : params.hours,
        features: [{ type: 'Feature', geometry: params.geometry }],
    };

    return { method: 'POST', url, data: body };
};
