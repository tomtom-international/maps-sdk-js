import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { buildExplorationSearchRequest } from '../requestBuilder';
import type { ExplorationSearchParams, ExplorationSearchRequestAPI } from '../types';
import requestBuilderData from './requestBuilder.data';

describe('Exploration Search request builder tests', () => {
    test.each(
        requestBuilderData,
    )("'%s'", (_name: string, params: ExplorationSearchParams, expected: ExplorationSearchRequestAPI) => {
        // Reparse via JSON to compare structure ignoring URL prototype identity and key order.
        // NOSONAR: structuredClone cannot clone URL objects; JSON round-trip is intentional here.
        expect(JSON.parse(JSON.stringify(buildExplorationSearchRequest(params)))).toMatchObject(
            JSON.parse(JSON.stringify(expected)),
        ); // NOSONAR
    });

    // The standard table-driven test can't easily assert on the buffered-circle ring (64 sampled
    // vertices), so the structural invariants get their own dedicated check.
    test('Circle geometry is sampled into a closed 64-vertex Polygon ring', () => {
        const result = buildExplorationSearchRequest({
            customServiceBaseURL: 'https://exploration.example.com',
            municipalities: ['Amsterdam'],
            geometries: [{ type: 'Circle', coordinates: [4.9, 52.37], radius: 1000 }],
        });

        expect(result.data?.geometries).toHaveLength(1);
        const polygon = result.data?.geometries?.[0];
        expect(polygon?.type).toBe('Polygon');
        const ring = polygon?.type === 'Polygon' ? polygon.coordinates[0] : [];
        // 64 boundary samples + the duplicate closing vertex.
        expect(ring).toHaveLength(65);
        expect(ring[0]).toEqual(ring.at(-1));
        for (const point of ring) {
            expect(Math.abs(point[0] - 4.9)).toBeLessThan(0.02);
            expect(Math.abs(point[1] - 52.37)).toBeLessThan(0.02);
        }
    });

    test('omits filter keys entirely when no inputs are supplied', () => {
        const { data } = buildExplorationSearchRequest({
            customServiceBaseURL: 'https://exploration.example.com',
            boundingBox: [4.85, 52.35, 4.95, 52.4],
        });
        expect(data).not.toHaveProperty('q');
        expect(data).not.toHaveProperty('country');
        expect(data).not.toHaveProperty('brand');
        expect(data).not.toHaveProperty('categories');
        expect(data).not.toHaveProperty('municipalities');
        expect(data).not.toHaveProperty('area_id');
        expect(data).not.toHaveProperty('area_tags');
        expect(data).not.toHaveProperty('near');
        expect(data).not.toHaveProperty('types');
        expect(data).not.toHaveProperty('geometries');
        expect(data).not.toHaveProperty('from');
        expect(data).not.toHaveProperty('size');
    });

    test('empty arrays for areaTags / placeTypes / poiCategories / municipalities do not pollute the payload', () => {
        const { data } = buildExplorationSearchRequest({
            customServiceBaseURL: 'https://exploration.example.com',
            boundingBox: [4.85, 52.35, 4.95, 52.4],
            areaTags: [],
            placeTypes: [],
            poiCategories: [],
            municipalities: [],
        });
        expect(data).not.toHaveProperty('area_tags');
        expect(data).not.toHaveProperty('types');
        expect(data).not.toHaveProperty('categories');
        expect(data).not.toHaveProperty('municipalities');
    });
});

describe('Exploration Search request builder performance tests', () => {
    test('Exploration Search request builder performance test', () => {
        // Reuse the heaviest combined-filters scenario from the data table — exercises every mapping.
        const heavyCase = requestBuilderData.find(([name]) => name.startsWith('all filters combined'));
        const params = heavyCase?.[1];
        if (!params) throw new Error('missing performance baseline scenario');
        expect(bestExecutionTimeMS(() => buildExplorationSearchRequest(params), 10)).toBeLessThan(
            MAX_EXEC_TIMES_MS.search.explorationSearch.requestBuilding,
        );
    });
});
