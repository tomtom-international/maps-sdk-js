import type { ChargingPoint, ChargingStationsAvailability } from '@anw/maps-sdk-js/core';
import { chargingPointStatus, chargingStationAccessTypes, connectorTypes } from '@anw/maps-sdk-js/core';
import { search } from '../../search';
import { SDKServiceError } from '../../shared';
import { putIntegrationTestsAPIKey } from '../../shared/tests/integrationTestUtils';
import evChargingStationsAvailability, { buildPlacesWithEVAvailability } from '../evChargingStationsAvailability';
import type { ChargingStationsAvailabilityResponseAPI } from '../types/apiTypes';

describe('charging availability errors', () => {
    test('charging availability test without API key', async () => {
        await expect(evChargingStationsAvailability({ id: '1234' })).rejects.toBeInstanceOf(SDKServiceError);
        await expect(evChargingStationsAvailability({ id: '1234' })).rejects.toMatchObject({
            service: 'EVChargingStationsAvailability',
            message: 'Request failed with status code 403',
            status: 403,
        });
    });
});

describe('evChargingStationsAvailability integration tests', () => {
    const statusRegex = new RegExp(chargingPointStatus.join('|'));
    const accessibilityRegex = new RegExp(chargingStationAccessTypes.join('|'));
    const connectorTypeRegex = new RegExp(connectorTypes.join('|'));
    beforeAll(() => putIntegrationTestsAPIKey());

    test('evChargingStationsAvailability', async () => {
        const chargingPointObj: ChargingPoint = expect.objectContaining({
            evseId: expect.any(String),
            status: expect.stringMatching(statusRegex),
            connectors: expect.arrayContaining([
                {
                    id: expect.any(String),
                    type: expect.stringMatching(connectorTypeRegex),
                    ratedPowerKW: expect.any(Number),
                    voltageV: expect.any(Number),
                    currentA: expect.any(Number),
                    currentType: expect.any(String),
                },
            ]),
        });

        const expectedResult: ChargingStationsAvailability = expect.objectContaining({
            id: '1f46c10e-ce37-4e99-8fdf-db22afe9c90b',
            accessType: expect.stringMatching(accessibilityRegex),
            chargingStations: [
                expect.objectContaining({
                    id: expect.any(String),
                    chargingPoints: expect.arrayContaining([chargingPointObj]),
                }),
            ],
            chargingPointAvailability: {
                count: expect.any(Number),
                statusCounts: expect.any(Object),
            },
            connectorAvailabilities: expect.any(Array),
            openingHours: expect.any(Object),
        });

        const result = await evChargingStationsAvailability({
            id: '1f46c10e-ce37-4e99-8fdf-db22afe9c90b',
        });

        expect(result).toMatchObject(expectedResult);
    });

    test('search combined with buildPlacesWithEVAvailability', async () => {
        const evStationsWithoutAvailability = await search({
            query: '',
            poiCategories: ['ELECTRIC_VEHICLE_STATION'],
            position: [13.41273, 52.52308], // Berlin
            limit: 15,
        });

        const evStationsWithAvailability = await buildPlacesWithEVAvailability(evStationsWithoutAvailability);
        const evStationFeatures = evStationsWithAvailability.features;
        expect(evStationFeatures).toHaveLength(evStationsWithoutAvailability.features.length);
        expect(evStationFeatures.some((feature) => feature.properties.chargingPark?.availability)).toBe(true);
        expect(evStationFeatures.every((feature) => feature.properties.chargingPark?.connectors)).toBe(true);
        expect(evStationFeatures.every((feature) => feature.properties.chargingPark?.connectorCounts)).toBe(true);
        // (opening hours are mapped from the EV station to the POI):
        expect(evStationFeatures.some((feature) => feature.properties.poi?.openingHours)).toBe(true);

        // we re-calculate now but filtering out the ones with unknown availability:
        const filteredEvStationsWithAvailability = await buildPlacesWithEVAvailability(evStationsWithoutAvailability, {
            returnIfAvailabilityUnknown: false,
        });

        expect(filteredEvStationsWithAvailability.features.length).toBeLessThan(evStationFeatures.length);

        expect(filteredEvStationsWithAvailability.features).toHaveLength(
            evStationFeatures.filter((feature) => feature.properties.chargingPark?.availability).length,
        );

        expect(filteredEvStationsWithAvailability.bbox).not.toEqual(evStationsWithAvailability.bbox);
    });

    test('ChargingStationsAvailability with API request and response callbacks', async () => {
        const onApiRequest = jest.fn() as (request: URL) => void;
        const onApiResponse = jest.fn() as (request: URL, response: ChargingStationsAvailabilityResponseAPI) => void;
        const result = await evChargingStationsAvailability({
            id: 'f989fb91-4866-4d03-91b5-fc4a9e82ad52',
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });
        expect(result?.chargingStations.length).toBeGreaterThan(0);
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test('ChargingStationsAvailability with API request and error response callbacks', async () => {
        const onApiRequest = jest.fn() as (request: URL) => void;
        const onApiResponse = jest.fn() as (request: URL, response: ChargingStationsAvailabilityResponseAPI) => void;
        await expect(() =>
            evChargingStationsAvailability({
                id: '57e78da9-5b0e-44ff-bd0f-f54e3b24292b',
                apiKey: 'invalid',
                onAPIRequest: onApiRequest,
                onAPIResponse: onApiResponse,
            }),
        ).rejects.toThrow(expect.objectContaining({ status: 403 }));
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 403 }));
    });
});
