import type { Brand, Moment, OpeningHours, Place, SearchPlaceProps, TimeRange } from '@tomtom-org/maps-sdk/core';
import { toPointFeature } from '@tomtom-org/maps-sdk/core';
import { omit } from 'lodash-es';
import { toConnectorCounts } from '../ev-charging-stations-availability/connectorAvailability';
import { apiToGeoJSONBBox, latLonAPIToPosition } from './geometry';
import type {
    CommonSearchPlaceResultAPI,
    MomentAPI,
    OpeningHoursAPI,
    SummaryAPI,
} from './types/apiPlacesResponseTypes';
import type { SearchSummary } from './types/searchSummary';

const parseYyyymmddDate = (dateYyyymmdd: string): { year: number; month: number; day: number } => {
    const splitDate = dateYyyymmdd.split('-');
    return {
        year: Number.parseInt(splitDate[0]),
        month: Number.parseInt(splitDate[1]),
        day: Number.parseInt(splitDate[2]),
    };
};

const parseMoment = (momentApi: MomentAPI): Moment => {
    const { year, month, day } = parseYyyymmddDate(momentApi.date);
    return {
        dateYYYYMMDD: momentApi.date,
        year,
        month,
        day,
        hour: momentApi.hour,
        minute: momentApi.minute,
        date: new Date(year, month - 1, day, momentApi.hour, momentApi.minute),
    };
};

const alwaysOpenInThisPeriod = (timeRanges: TimeRange[]): boolean =>
    timeRanges.length === 1 && timeRanges[0].start.hour === 0 && timeRanges[0].end.hour === 0;

/**
 * @ignore
 */
export const parseOpeningHours = (openingHoursApi: OpeningHoursAPI): OpeningHours => {
    const timeRanges = openingHoursApi.timeRanges.map(
        (timeRangeApi): TimeRange => ({
            start: parseMoment(timeRangeApi.startTime),
            end: parseMoment(timeRangeApi.endTime),
        }),
    );
    return {
        mode: openingHoursApi.mode,
        timeRanges,
        alwaysOpenThisPeriod: alwaysOpenInThisPeriod(timeRanges),
    };
};

/**
 * Shared response parsing between geometry search and place by id service.
 * @ignore
 */
export const parseSearchAPIResult = (result: CommonSearchPlaceResultAPI): Place<SearchPlaceProps> => {
    const { position, entryPoints, poi, id, dist, boundingBox, chargingPark, ...rest } = result;
    const connectors = chargingPark?.connectors?.map((connector) => ({
        ...omit(connector, 'connectorType'),
        type: connector.connectorType,
    }));
    return {
        ...toPointFeature(latLonAPIToPosition(position)),
        ...(boundingBox && { bbox: apiToGeoJSONBBox(boundingBox) }),
        id,
        properties: {
            ...omit(rest, 'viewport'),
            ...(dist && { distance: dist }),
            ...(entryPoints && {
                entryPoints: entryPoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: latLonAPIToPosition(entrypoint.position),
                })),
            }),
            ...(connectors && {
                chargingPark: {
                    ...chargingPark,
                    connectors,
                    connectorCounts: toConnectorCounts(connectors),
                },
            }),
            poi: {
                ...omit(poi, 'categorySet', 'openingHours'),
                brands: poi?.brands?.map((brand: Brand) => brand.name) ?? [],
                categoryIds: poi?.categorySet?.map((category) => category.id) ?? [],
                ...(poi?.openingHours && { openingHours: parseOpeningHours(poi?.openingHours) }),
            },
        },
    };
};

/**
 * @ignore
 */
export const parseSummaryAPI = (summary: SummaryAPI): SearchSummary => {
    const { geoBias, ...rest } = summary;

    return {
        ...(geoBias && { geoBias: latLonAPIToPosition(geoBias) }),
        ...rest,
    };
};
