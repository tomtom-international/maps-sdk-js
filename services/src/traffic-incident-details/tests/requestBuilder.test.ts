import { GeoJsonObject } from 'geojson';
import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildTrafficIncidentDetailsRequest } from '../requestBuilder';

const BASE = 'https://api-test.tomtom.com';
const KEY = 'TEST_API_KEY';
const COMMON = { apiKey: KEY, apiVersion: 1, commonBaseURL: BASE } as const;

describe('buildTrafficIncidentDetailsRequest — bbox mode (GET)', () => {
    test('builds a GET request with bbox', () => {
        const result = buildTrafficIncidentDetailsRequest({
            ...COMMON,
            bbox: [4.728, 52.278, 5.08, 52.479],
        });

        expect(result.method).toBe('GET');
        const url = result.url.toString();
        expect(url).toContain(`${BASE}/maps/orbis/traffic/incidentDetails`);
        expect(url).toContain('apiVersion=1');
        expect(url).toContain(`key=${KEY}`);
        expect(url).toContain('bbox=4.728%2C52.278%2C5.08%2C52.479');
        // default fields projection should always be present
        expect(result.url.searchParams.has('fields')).toBe(true);
    });

    test('appends optional params', () => {
        const result = buildTrafficIncidentDetailsRequest({
            ...COMMON,
            bbox: [4.728, 52.278, 5.08, 52.479],
            language: 'nl-NL',
            categoryFilter: ['accident', 'road-closed'],
            timeValidityFilter: ['present', 'future'],
            trafficModelId: 'model123',
        });

        expect(result.method).toBe('GET');
        const url = result.url.toString();
        expect(url).toContain('language=nl-NL');
        expect(url).toContain('categoryFilter=1%2C8');
        expect(url).toContain('timeValidityFilter=present%2Cfuture');
        expect(url).toContain('t=model123');
    });
});

describe('buildTrafficIncidentDetailsRequest — bbox mode (GeoJSON inputs)', () => {
    test('resolves bbox from a GeoJSON Feature (Point geometry)', () => {
        const result = buildTrafficIncidentDetailsRequest({
            ...COMMON,
            bbox: {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [4.9, 52.37] },
                properties: {},
            } as GeoJsonObject,
        });

        expect(result.method).toBe('GET');
        // A single point produces a zero-size bbox: [lon, lat, lon, lat]
        expect(result.url.searchParams.get('bbox')).toBe('4.9,52.37,4.9,52.37');
    });

    test('resolves bbox from an array of GeoJSON Features', () => {
        const result = buildTrafficIncidentDetailsRequest({
            ...COMMON,
            bbox: [
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [4.9, 52.37] },
                    properties: {},
                } as GeoJsonObject,
                {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [5.0, 52.45] },
                    properties: {},
                } as GeoJsonObject,
            ],
        });

        expect(result.method).toBe('GET');
        // Combined bbox spans both points (5.0 serialises as "5" in JS)
        expect(result.url.searchParams.get('bbox')).toBe('4.9,52.37,5,52.45');
    });

    test('uses a pre-existing bbox property on a GeoJSON Feature', () => {
        const result = buildTrafficIncidentDetailsRequest({
            ...COMMON,
            bbox: {
                type: 'Feature',
                bbox: [4.728, 52.278, 5.08, 52.479],
                geometry: { type: 'Point', coordinates: [4.9, 52.37] },
                properties: {},
            } as GeoJsonObject,
        });

        expect(result.method).toBe('GET');
        expect(result.url.searchParams.get('bbox')).toBe('4.728,52.278,5.08,52.479');
    });
});

describe('buildTrafficIncidentDetailsRequest — ids mode (GET, ≤5 ids)', () => {
    test('builds a GET request with ids in query string', () => {
        const result = buildTrafficIncidentDetailsRequest({
            ...COMMON,
            ids: ['id-1', 'id-2'],
        });

        expect(result.method).toBe('GET');
        expect(result.url.toString()).toContain('ids=id-1%2Cid-2');
    });

    test('uses GET for exactly 5 ids', () => {
        const result = buildTrafficIncidentDetailsRequest({
            ...COMMON,
            ids: ['id-1', 'id-2', 'id-3', 'id-4', 'id-5'],
        });
        expect(result.method).toBe('GET');
    });
});

describe('buildTrafficIncidentDetailsRequest — ids mode (POST, >5 ids)', () => {
    test('builds a POST request with ids in the body when more than 5 are given', () => {
        const ids = ['id-1', 'id-2', 'id-3', 'id-4', 'id-5', 'id-6'];
        const result = buildTrafficIncidentDetailsRequest({ ...COMMON, ids });

        expect(result.method).toBe('POST');
        expect((result as { data: { ids: string[] } }).data).toEqual({ ids });
        // ids must NOT appear in the query string for POST
        expect(result.url.searchParams.has('ids')).toBe(false);
    });
});

describe('buildTrafficIncidentDetailsRequest — custom base URL', () => {
    test('uses customServiceBaseURL when provided', () => {
        const result = buildTrafficIncidentDetailsRequest({
            ...COMMON,
            customServiceBaseURL: 'https://custom.example.com/traffic/incidentDetails',
            bbox: [0, 0, 1, 1],
        });

        expect(result.url.toString()).toContain('https://custom.example.com/traffic/incidentDetails');
    });
});

describe('buildTrafficIncidentDetailsRequest — performance', () => {
    test('bbox request builds within time budget', () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    buildTrafficIncidentDetailsRequest({
                        ...COMMON,
                        bbox: [4.728, 52.278, 5.08, 52.479],
                    }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.trafficIncidentDetails.requestBuilding);
    });
});
