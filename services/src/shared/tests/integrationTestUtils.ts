import type { Moment, OpeningHours, Place, SearchPlaceProps } from '@anw/maps-sdk-js/core';
import { placeTypes, TomTomConfig } from '@anw/maps-sdk-js/core';
import { expect } from 'vitest';

export const putIntegrationTestsAPIKey = () => {
    TomTomConfig.instance.put({
        apiKey: process.env.API_KEY_TESTS
    });
};

const basePoiObjTestProps = {
    name: expect.any(String),
    classifications: expect.anything(),
    brands: expect.any(Array),
    categoryIds: expect.arrayContaining([expect.any(Number)]),
};

export const basePOITestProps: SearchPlaceProps = {
    type: 'POI',
    score: expect.any(Number),
    info: expect.any(String),
    address: expect.any(Object),
    entryPoints: expect.arrayContaining([expect.any(Object)]),
    poi: expect.objectContaining(basePoiObjTestProps),
};

export const evStationBaseTestProps: SearchPlaceProps = {
    type: 'POI',
    score: expect.any(Number),
    info: expect.any(String),
    address: expect.any(Object),
    poi: expect.objectContaining(basePoiObjTestProps),
    chargingPark: expect.objectContaining({
        // connectors: expect.any(Array),
        connectorCounts: expect.any(Array),
    }),
};

const momentTestProps: Moment = {
    date: expect.any(Date),
    dateYYYYMMDD: expect.any(String),
    day: expect.any(Number),
    hour: expect.any(Number),
    minute: expect.any(Number),
    month: expect.any(Number),
    year: expect.any(Number),
};

const openingHoursTestProps: OpeningHours = {
    mode: 'nextSevenDays',
    alwaysOpenThisPeriod: expect.any(Boolean),
    timeRanges: expect.arrayContaining([{ start: momentTestProps, end: momentTestProps }]),
};

export const evStationWithOpeningHoursTestProps: SearchPlaceProps = {
    ...evStationBaseTestProps,
    poi: expect.objectContaining({
        ...basePoiObjTestProps,
        openingHours: expect.objectContaining(openingHoursTestProps),
    }),
};

export const expectPlaceTestFeature = (props: SearchPlaceProps): Place<SearchPlaceProps> =>
    expect.objectContaining({
        type: 'Feature',
        id: expect.any(String),
        geometry: expect.objectContaining({
            type: 'Point',
            coordinates: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
        }),
        properties: expect.objectContaining<SearchPlaceProps>(props),
    });

const placeRegex = new RegExp(placeTypes.join('|'));
export const baseSearchPlaceMandatoryProps: SearchPlaceProps = {
    type: expect.stringMatching(placeRegex),
    address: expect.any(Object),
};
