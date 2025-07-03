import { TomTomConfig } from '@anw/maps-sdk-js/core';
import {
    basePOITestProps,
    evStationWithOpeningHoursTestProps,
    expectPlaceTestFeature,
} from '../../shared/tests/integrationTestUtils';
import type { PlaceByIdResponseAPI } from '..';
import { placeById } from '..';

describe('Place By Id API', () => {
    beforeAll(() => TomTomConfig.instance.put({ apiKey: process.env.API_KEY }));

    test('placeById not found', async () => {
        const place = await placeById({ entityId: 'NOT_HERE' });
        expect(place).toBeUndefined();
    });

    test('placeById works', async () => {
        const entityId = 'FD3yZ3ADZ4h2w_Fl9Acm0w';
        const place = await placeById({
            entityId,
            language: 'en-GB',
            view: 'Unified',
            timeZone: 'iana',
            openingHours: 'nextSevenDays',
        });

        expect(place).toBeDefined();
        expect(place).toEqual(expectPlaceTestFeature(basePOITestProps));
    });

    // TODO: opening hours not yet available in Orbis. Once POI TimeZones are available they should become supported again. ETA end of Q2 2024.
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('placeById for EV charging station with opening hours', async () => {
        const place = await placeById({
            entityId: '5xJ_SaD2QbJmkNiMfu6_Og',
            openingHours: 'nextSevenDays',
        });

        expect(place).toBeDefined();
        expect(place).toEqual(expectPlaceTestFeature(evStationWithOpeningHoursTestProps));
    });

    test('placeById with API request and response callbacks', async () => {
        const entityId = 'FD3yZ3ADZ4h2w_Fl9Acm0w';
        const onApiRequest = jest.fn() as (request: URL) => void;
        const onApiResponse = jest.fn() as (request: URL, response: PlaceByIdResponseAPI) => void;
        const place = await placeById({ entityId, onAPIRequest: onApiRequest, onAPIResponse: onApiResponse });
        expect(place).toBeDefined();
        expect(onApiResponse).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    test('placeById with API request and error response callbacks', async () => {
        const entityId = 'FD3yZ3ADZ4h2w_Fl9Acm0w';
        const onApiRequest = jest.fn() as (request: URL) => void;
        const onApiResponse = jest.fn() as (request: URL, response: PlaceByIdResponseAPI) => void;
        await expect(() =>
            placeById({
                entityId,
                view: 'INCORRECT' as never,
                validateRequest: false,
                onAPIRequest: onApiRequest,
                onAPIResponse: onApiResponse,
            }),
        ).rejects.toThrow(expect.objectContaining({ status: 400 }));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 400 }));
    });
});
