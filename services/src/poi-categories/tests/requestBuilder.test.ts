import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildPoiCategoriesRequest } from '../requestBuilder';
import type { POICategoriesParams } from '../types';
import { poiCategoriesReqObjects } from './requestBuilderPerf.data';

// The key and version travel as headers; `language` stays in the query because the
// `apiVersion=1` places endpoints ignore `Accept-Language`.
const HEADERS = { 'TomTom-Api-Key': 'testKey', 'TomTom-Api-Version': '1' };

describe('POI categories request building tests', () => {
    test('builds the URL and credential headers with mandatory parameters only', () => {
        const request = buildPoiCategoriesRequest({
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'testKey',
            apiVersion: 1,
        });

        expect(request.url.toString()).toStrictEqual(
            'https://api-test.tomtom.com/maps/orbis/places/poiCategories.json',
        );
        expect(request.headers).toStrictEqual(HEADERS);
    });

    test('language stays in the query string, not in a header', () => {
        const request = buildPoiCategoriesRequest({
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'testKey',
            apiVersion: 1,
            language: 'fr-FR',
        });

        expect(request.url.toString()).toStrictEqual(
            'https://api-test.tomtom.com/maps/orbis/places/poiCategories.json?language=fr-FR',
        );
        expect(request.headers).toStrictEqual(HEADERS);
    });

    test('filters is not included in the URL (it is applied client-side)', () => {
        const request = buildPoiCategoriesRequest({
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'testKey',
            apiVersion: 1,
            filters: ['restaurant'],
        } as POICategoriesParams & { apiVersion: number });

        expect(request.url.toString()).not.toContain('filter');
        expect(request.url.toString()).toStrictEqual(
            'https://api-test.tomtom.com/maps/orbis/places/poiCategories.json',
        );
    });

    test('uses customServiceBaseURL when provided', () => {
        const request = buildPoiCategoriesRequest({
            customServiceBaseURL: 'https://custom-api.example.com/categories',
            apiKey: 'testKey',
            apiVersion: 1,
        });

        expect(request.url.toString()).toStrictEqual('https://custom-api.example.com/categories');
        expect(request.headers).toStrictEqual(HEADERS);
    });
});

describe('POI categories request URL performance tests', () => {
    test('POI categories request URL performance test', () => {
        expect(bestExecutionTimeMS(() => buildPoiCategoriesRequest(poiCategoriesReqObjects), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.poiCategories.requestBuilding,
        );
    });
});
