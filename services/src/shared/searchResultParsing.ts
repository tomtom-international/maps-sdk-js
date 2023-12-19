import { Brand, Moment, OpeningHours, Place, SearchPlaceProps, TimeRange, toPointFeature } from "@anw/maps-sdk-js/core";
import omit from "lodash/omit";
import { apiToGeoJSONBBox, latLonAPIToPosition } from "./geometry";
import { CommonSearchPlaceResultAPI, MomentAPI, OpeningHoursAPI, SummaryAPI } from "./types/apiPlacesResponseTypes";
import { toConnectorCounts } from "../ev-charging-stations-availability/connectorAvailability";
import { SearchSummary } from "./types/searchSummary";

const parseYYYYMMDDDate = (dateYYYYMMDD: string): { year: number; month: number; day: number } => {
    const splitDate = dateYYYYMMDD.split("-");
    return {
        year: parseInt(splitDate[0]),
        month: parseInt(splitDate[1]),
        day: parseInt(splitDate[2])
    };
};

const parseMoment = (momentAPI: MomentAPI): Moment => {
    const { year, month, day } = parseYYYYMMDDDate(momentAPI.date);
    return {
        dateYYYYMMDD: momentAPI.date,
        year,
        month,
        day,
        hour: momentAPI.hour,
        minute: momentAPI.minute,
        date: new Date(year, month - 1, day, momentAPI.hour, momentAPI.minute)
    };
};

const alwaysOpenInThisPeriod = (timeRanges: TimeRange[]): boolean =>
    timeRanges.length == 1 && timeRanges[0].start.hour == 0 && timeRanges[0].end.hour == 0;

/**
 * @ignore
 */
export const parseOpeningHours = (openingHoursAPI: OpeningHoursAPI): OpeningHours => {
    const timeRanges = openingHoursAPI.timeRanges.map(
        (timeRangeAPI): TimeRange => ({
            start: parseMoment(timeRangeAPI.startTime),
            end: parseMoment(timeRangeAPI.endTime)
        })
    );
    return {
        mode: openingHoursAPI.mode,
        timeRanges,
        alwaysOpenThisPeriod: alwaysOpenInThisPeriod(timeRanges)
    };
};

/**
 * Shared response parsing between geometry search and place by id service.
 * @ignore
 */
export const parseSearchAPIResult = (result: CommonSearchPlaceResultAPI): Place<SearchPlaceProps> => {
    const { position, entryPoints, poi, id, dist, boundingBox, chargingPark, ...rest } = result;
    const connectors = chargingPark?.connectors?.map((connector) => ({
        ...omit(connector, "connectorType"),
        type: connector.connectorType
    }));
    return {
        ...toPointFeature(latLonAPIToPosition(position)),
        ...(boundingBox && { bbox: apiToGeoJSONBBox(boundingBox) }),
        id,
        properties: {
            ...omit(rest, "viewport"),
            ...(dist && { distance: dist }),
            ...(entryPoints && {
                entryPoints: entryPoints.map((entrypoint) => ({
                    ...entrypoint,
                    position: latLonAPIToPosition(entrypoint.position)
                }))
            }),
            ...(connectors && {
                chargingPark: {
                    ...chargingPark,
                    connectors,
                    connectorCounts: toConnectorCounts(connectors)
                }
            }),
            poi: {
                ...omit(poi, "categorySet", "openingHours"),
                brands: poi?.brands?.map((brand: Brand) => brand.name) ?? [],
                categoryIds: poi?.categorySet?.map((category) => category.id) ?? [],
                ...(poi?.openingHours && { openingHours: parseOpeningHours(poi?.openingHours) })
            }
        }
    };
};

/**
 * @ignore
 */
export const parseSummaryAPI = (summary: SummaryAPI): SearchSummary => {
    const { geoBias, ...rest } = summary;

    return {
        ...(geoBias && { geoBias: latLonAPIToPosition(geoBias) }),
        ...rest
    };
};
