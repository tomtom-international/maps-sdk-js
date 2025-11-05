import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { customizeService } from '../../../index';
import { SDKServiceError } from '../../shared';
import { putIntegrationTestsAPIKey } from '../../shared/tests/integrationTestUtils';
import reverseGeocode from '../reverseGeocoding';
import type { ReverseGeocodingResponseAPI } from '../types/apiTypes';

describe('Reverse Geocoding integration test without API key', () => {
    test('Reverse Geocoding integration test without API key', async () => {
        const coordinates = { position: [5.72884, 52.33499] };

        await expect(reverseGeocode(coordinates)).rejects.toBeInstanceOf(SDKServiceError);
        await expect(reverseGeocode(coordinates)).rejects.toMatchObject({
            service: 'ReverseGeocode',
            status: 403,
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
        const exampleSdkResponse = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [5.72884, 52.33499],
            },
            bbox: expect.any(Array),
            id: expect.any(String),
            properties: {
                type: 'Street',
                address: {
                    routeNumbers: [],
                    street: 'Hierderweg',
                    streetName: 'Hierderweg',
                    countryCode: 'NL',
                    countrySubdivision: 'Gelderland',
                    municipality: 'Nunspeet',
                    postalCode: expect.any(String),
                    municipalitySubdivision: 'Hulshorst',
                    country: 'Nederland',
                    countryCodeISO3: 'NLD',
                    freeformAddress: expect.any(String),
                    localName: 'Hulshorst',
                },
                originalPosition: expect.any(Array),
            },
        };
    });

    test('Verify TomTom-User-Agent header is sent', async () => {
        // Spy on fetch to verify the TomTom-User-Agent header is sent
        const fetchSpy = vi.spyOn(global, 'fetch');
        await reverseGeocode({ position: [5.72884, 52.33499] });

        // Verify that fetch was called with the TomTom-User-Agent header
        const headers = fetchSpy.mock.calls[0][1]?.headers as Record<string, string>;
        expect(headers['TomTom-User-Agent']).toMatch(/^MapsSDKJS\/\d+\.\d+\.\d+.*$/);
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

    test('Reverse geocoding with international mapcodes', async () => {
        const result = await reverseGeocode({ position: [5.72884, 52.33499], mapcodes: ['International'] });
        expect(result).toBeDefined();
    });

    test('Reverse geocoding with all mapcode types', async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            mapcodes: ['Local', 'International', 'Alternative'],
        });
        expect(result).toBeDefined();
    });

    test('Reverse geocoding with house number input', async () => {
        const overhoeksPlein = [4.90224, 52.38388];
        // Point by Overhoeksplein, ensuring 21B:
        const resultWithNumber = await reverseGeocode({ position: overhoeksPlein, number: '23A' });
        expect(resultWithNumber).toMatchObject({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [4.90224, 52.38388],
            },
            bbox: expect.any(Array),
            id: expect.any(String),
            properties: {
                type: 'Point Address',
                address: {
                    routeNumbers: [],
                    street: 'Overhoeksplein',
                    streetName: 'Overhoeksplein',
                    countryCode: 'NL',
                    countrySubdivision: 'Noord-Holland',
                    municipality: 'Amsterdam',
                    postalCode: expect.any(String),
                    municipalitySubdivision: 'Amsterdam Havens',
                    country: 'Nederland',
                    countryCodeISO3: 'NLD',
                    freeformAddress: expect.stringContaining('Overhoeksplein'),
                    localName: 'Amsterdam',
                },
                originalPosition: expect.any(Array),
            },
        });
    });

    test('Reverse geocoding from the sea with small radius', async () => {
        const result = await reverseGeocode({ position: [4.49112, 52.35937], radiusMeters: 10 });
        expect(result.properties.address).toBeUndefined();
    });

    test('Reverse geocoding from the sea with default radius which yields a result', async () => {
        const result = await reverseGeocode({ position: [4.49112, 52.35937] });
        expect(result.properties.address).toBeDefined();
    });

    test('Reverse geocoding with specified road uses', async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            returnRoadUse: true,
            roadUses: ['Terminal', 'LocalStreet'],
        });
        expect(result).toBeDefined();
    });

    test('Reverse geocoding with most options as non defaults', async () => {
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            allowFreeformNewline: true,
            heading: 90,
            language: 'nl-NL',
            mapcodes: ['Local', 'International'],
            number: '10',
            radiusMeters: 50000,
            returnRoadUse: true,
            roadUses: ['Ramp'],
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
        const onApiRequest = vi.fn() as (request: URL) => void;
        const onApiResponse = vi.fn() as (request: URL, response: ReverseGeocodingResponseAPI) => void;
        const result = await reverseGeocode({
            position: [5.72884, 52.33499],
            onAPIRequest: onApiRequest,
            onAPIResponse: onApiResponse,
        });
        expect(result).toBeDefined();
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.anything());
    });

    test('Reverse geocoding with API request and response error callbacks', async () => {
        const onApiRequest = vi.fn() as (request: URL) => void;
        const onApiResponse = vi.fn() as (request: URL, response: ReverseGeocodingResponseAPI) => void;
        await expect(() =>
            reverseGeocode({
                position: [5.72884, 52.33499],
                apiKey: 'INCORRECT',
                onAPIRequest: onApiRequest,
                onAPIResponse: onApiResponse,
            }),
        ).rejects.toThrow(expect.objectContaining({ status: 403 }));
        expect(onApiRequest).toHaveBeenCalledWith(expect.any(URL));
        expect(onApiResponse).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ status: 403 }));
    });
});
