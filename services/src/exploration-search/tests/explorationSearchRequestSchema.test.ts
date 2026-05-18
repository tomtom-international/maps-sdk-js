import { describe, expect, test } from 'vitest';
import { validateRequestSchema } from '../../shared/schema/validation';
import { explorationSearchRequestValidationConfig } from '../explorationSearchRequestSchema';
import type { ExplorationSearchParams } from '../types';

const COMMON = {
    apiKey: 'TEST_KEY',
    apiVersion: 1,
    commonBaseURL: 'https://api.tomtom.com',
} as const;

const BBOX: [number, number, number, number] = [4.85, 52.35, 4.95, 52.4];

const POLYGON = {
    type: 'Polygon' as const,
    coordinates: [
        [
            [4.85, 52.35],
            [4.95, 52.35],
            [4.95, 52.4],
            [4.85, 52.4],
            [4.85, 52.35],
        ],
    ],
};

describe('Exploration Search schema — geo-bias refinement', () => {
    test('rejects requests with no geographic filter', () => {
        expect(() =>
            validateRequestSchema({ ...COMMON, query: 'cafe' }, explorationSearchRequestValidationConfig),
        ).toThrow(/geographic bias is required/);
    });

    test('accepts position as a standalone geo-bias', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, query: 'cafe', position: [4.9, 52.37] } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    test('accepts boundingBox as a standalone geo-bias', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, query: 'cafe', boundingBox: BBOX } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    test('accepts a non-empty boundingBoxes array as a standalone geo-bias', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, query: 'cafe', boundingBoxes: [BBOX] } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    test('rejects an empty boundingBoxes array as the sole geo-bias', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, query: 'cafe', boundingBoxes: [] } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).toThrow(/geographic bias is required/);
    });

    test('accepts a geometry as a standalone geo-bias', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, query: 'cafe', geometries: [POLYGON] } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    test('accepts municipalities as a standalone geo-bias', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, query: 'cafe', municipalities: ['Amsterdam'] } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    test('accepts areaId as a standalone geo-bias', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, query: 'cafe', areaId: '20567430' } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    test('rejects when areaTags is provided without a geo-bias', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, query: 'cafe', areaTags: ['walkable'] } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).toThrow(/geographic bias is required/);
    });
});

describe('Exploration Search schema — pagination window refinement', () => {
    test('accepts offset + limit at the cap', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, offset: 9000, limit: 1000 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    test('rejects offset + limit one past the cap', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, offset: 9001, limit: 1000 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).toThrow(/offset \+ limit must not exceed 10000/);
    });

    test('accepts limit alone up to the cap', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, limit: 10000 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    // The wire request omits `size` when `limit` is undefined, and the backend then defaults to 10,
    // so the refinement charges 10 against the window for an unbounded `offset`.
    test('rejects offset at the cap when limit is omitted (backend default size pushes over)', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, offset: 10000 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).toThrow(/offset \+ limit must not exceed 10000/);
    });

    test('accepts offset = MAX − default size when limit is omitted', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, offset: 9990 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).not.toThrow();
    });

    test('rejects offset > MAX_WINDOW outright (per-field bound)', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, offset: 10001 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).toThrow();
    });

    test('rejects limit > MAX_WINDOW outright (per-field bound)', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, limit: 10001 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).toThrow();
    });

    test('rejects limit < 1', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, limit: 0 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).toThrow();
    });

    test('rejects negative offset', () => {
        expect(() =>
            validateRequestSchema(
                { ...COMMON, boundingBox: BBOX, offset: -1 } as ExplorationSearchParams,
                explorationSearchRequestValidationConfig,
            ),
        ).toThrow();
    });
});
