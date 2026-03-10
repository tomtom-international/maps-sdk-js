import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildPoiCategoriesRequest } from '../requestBuilder';
import type { POICategoriesParams } from '../types';
import { poiCategoriesReqObjects } from './requestBuilderPerf.data';

describe('POI categories request URL building tests', () => {
    test('builds URL with mandatory parameters only', () => {
        expect(
            buildPoiCategoriesRequest({
                commonBaseURL: 'https://api-test.tomtom.com',
                apiKey: 'testKey',
                apiVersion: 1,
            }).toString(),
        ).toStrictEqual('https://api-test.tomtom.com/maps/orbis/places/poiCategories.json?apiVersion=1&key=testKey');
    });

    test('builds URL with language', () => {
        expect(
            buildPoiCategoriesRequest({
                commonBaseURL: 'https://api-test.tomtom.com',
                apiKey: 'testKey',
                apiVersion: 1,
                language: 'fr-FR',
            }).toString(),
        ).toStrictEqual(
            'https://api-test.tomtom.com/maps/orbis/places/poiCategories.json?apiVersion=1&key=testKey&language=fr-FR',
        );
    });

    test('filters is not included in the URL (it is applied client-side)', () => {
        const url = buildPoiCategoriesRequest({
            commonBaseURL: 'https://api-test.tomtom.com',
            apiKey: 'testKey',
            apiVersion: 1,
            filters: ['restaurant'],
        } as POICategoriesParams & { apiVersion: number }).toString();

        expect(url).not.toContain('filter');
        expect(url).toStrictEqual(
            'https://api-test.tomtom.com/maps/orbis/places/poiCategories.json?apiVersion=1&key=testKey',
        );
    });

    test('uses customServiceBaseURL when provided', () => {
        expect(
            buildPoiCategoriesRequest({
                customServiceBaseURL: 'https://custom-api.example.com/categories',
                apiKey: 'testKey',
                apiVersion: 1,
            }).toString(),
        ).toStrictEqual('https://custom-api.example.com/categories?apiVersion=1&key=testKey');
    });
});

describe('POI categories request URL performance tests', () => {
    test('POI categories request URL performance test', () => {
        expect(bestExecutionTimeMS(() => buildPoiCategoriesRequest(poiCategoriesReqObjects), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.poiCategories.requestBuilding,
        );
    });
});
