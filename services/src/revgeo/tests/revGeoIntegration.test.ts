import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { customizeService } from '../../../index';
import type { GetObject } from '../../shared';
import { SDKServiceError } from '../../shared';
import { putIntegrationTestsAPIKey } from '../../shared/tests/integrationTestUtils';
import { reverseGeocode } from '../reverseGeocoding';
import type { ReverseGeocodingResponseAPI } from '../types/apiTypes';

describe('Reverse Geocoding integration test without API key', () => {
    test('Reverse Geocoding integration test without API key', async () => {
        const coordinates = { position: [5.72884, 52.33499] };

        await expect(reverseGeocode(coordinates)).rejects.toBeInstanceOf(SDKServiceError);
        await expect(reverseGeocode(coordinates)).rejects.toMatchObject({
            service: 'ReverseGeocode',
            status: 401,
        });
    });
});

describe('Reverse Geocoding integration tests', () => {
    beforeAll(putIntegrationTestsAPIKey);

    beforeEach(async () => {
        // We enforce a delay before each test to avoid hitting the API rate limits.
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000));
    });

    test('Default reverse geocoding', async () => {
        const coordinates = [5.72884, 52.33499];

        const exampleSdkResponse = {
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            id: expect.any(String),
            properties: {
                type: expect.any(String),
                address: {
                    streetName: 'Hierderweg',
                    countryCode: 'NL',
                    countrySubdivision: 'Gelderland',
                    municipality: 'Nunspeet',
                    postalCode: expect.any(String),
                    municipalitySubdivision: 'Hulshorst',
                    country: 'Nederland',
                    freeformAddress: expect.any(String),
                },
                originalPosition: expect.any(Array),
            },
        };

        const result = await reverseGeocode({ position: coordinates });
        expect(result).toMatchObject(exampleSdkResponse);
    });

    test('Verify tomtom-user-agent header is sent', async () => {
        // Spy on fetch to verify the tomtom-user-agent header is sent
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        await reverseGeocode({ position: [5.72884, 52.33499] });

        // Verify that fetch was called with the tomtom-user-agent header
        const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
        expect(headers['tomtom-user-agent']).toMatch(/^MapsSDKJS\/\d+\.\d+\.\d+.*$/);
        fetchSpy.mockRestore();
    });

    test('Verify TomTom-Api-Version and Attributes headers are sent', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        await reverseGeocode({ position: [5.72884, 52.33499] });

        const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
        expect(headers['TomTom-Api-Version']).toStrictEqual('2');
        expect(headers.Attributes).toBeTruthy();
        fetchSpy.mockRestore();
    });

    test('Localized reverse geocoding', async () => {
        const result = await reverseGeocode({ position: [-0.12681, 51.50054], language: 'es-ES' });
        expect(result).toBeDefined();
        expect(result.properties.address.country).toStrictEqual('Reino Unido');
    });

    test('Country reverse geocoding', async () => {
        const result = await reverseGeocode({ position: [5.72884, 52.33499], geographyType: ['Country'] });
        expect(result).toBeDefined();
        expect(result.properties.address.streetName).toBeUndefined();
        expect(result.properties.type).toBe('Geography');
    });

    test('Reverse geocoding for a precise address point', async () => {
        const overhoeksPlein = [4.90224, 52.38388];
        const result = await reverseGeocode({ position: overhoeksPlein });
        expect(result).toMatchObject({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [4.90224, 52.38388],
            },
            id: expect.any(String),
            properties: {
                type: expect.any(String),
                address: {
                    streetName: 'Overhoeksplein',
                    countryCode: 'NL',
                    countrySubdivision: 'Noord-Holland',
                    municipality: 'Amsterdam',
                    postalCode: expect.any(String),
                    municipalitySubdivision: 'Amsterdam Havens',
                    country: 'Nederland',
                    freeformAddress: expect.stringContaining('Overhoeksplein'),
                },
                originalPosition: expect.any(Array),
            },
        });
    });

    test('Reverse geocoding from the sea with small radius', async () => {
        const result = await reverseGeocode({ position: [4.49112, 52.35937], radiusMeters: 10 });
        expect(result.properties).toBeUndefined();
    });

    test('Reverse geocoding from the sea with default radius which yields a result', async () => {
        const result = await reverseGeocode({ position: [4.49112, 52.35937] });
        expect(result.properties.address).toBeDefined();
    });

    test('Reverse geocoding with most options as non defaults', async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            heading: 90,
            language: 'nl-NL',
            radiusMeters: 50000,
        });
        expect(result).toBeDefined();
    });

    test('Reverse geocoding with template response override', async () => {
        const result = await reverseGeocode(
            { position: [-0.12681, 51.50054] },
            {
                parseResponse: (params, response) => ({
                    ...customizeService.reverseGeocode.parseRevGeoResponse(params, response),
                    newField: 'test',
                }),
            },
        );
        expect(result).toStrictEqual({ ...result, newField: 'test' });
    });

    test('Reverse geocoding with API request and response callbacks', async () => {
        const onApiRequest = vi.fn() as (request: GetObject) => void;
        const onApiResponse = vi.fn() as (request: GetObject, response: ReverseGeocodingResponseAPI) => void;
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });
        expect(result).toBeDefined();
        expect(onApiRequest).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(URL) }));
        expect(onApiResponse).toHaveBeenCalledWith(
            expect.objectContaining({ url: expect.any(URL) }),
            expect.anything(),
        );
    });

    test('Reverse geocoding with API request and response error callbacks', async () => {
        const onApiRequest = vi.fn() as (request: GetObject) => void;
        const onApiResponse = vi.fn() as (request: GetObject, response: ReverseGeocodingResponseAPI) => void;
        await expect(() =>
            reverseGeocode({
                position: [5.72884, 52.33499],
                apiKey: 'INCORRECT',
                onAPIRequest: onApiRequest,
                onAPIResponse: onApiResponse,
            }),
        ).rejects.toThrow(expect.objectContaining({ status: 401 }));
        expect(onApiRequest).toHaveBeenCalledWith(expect.objectContaining({ url: expect.any(URL) }));
        expect(onApiResponse).toHaveBeenCalledWith(
            expect.objectContaining({ url: expect.any(URL) }),
            expect.objectContaining({ status: 401 }),
        );
    });
});
