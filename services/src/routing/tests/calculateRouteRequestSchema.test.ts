import { inputSectionTypes } from 'core';
import { describe, expect, test } from 'vitest';
import { bestExecutionTimeMS } from '../../../../core/src/util/tests/performanceTestUtils';
import { validateRequestSchema } from '../../shared/schema/validation';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { routeRequestValidationConfig } from '../calculateRouteRequestSchema';
import type { CalculateRouteParams } from '../types/calculateRouteParams';
import { routeRequestParams } from './requestBuilderPerf.data';

describe('Calculate route request schema validation', () => {
    const apiKey = 'APIKEY';
    const commonBaseUrl = 'https://api-test.tomtom.com';

    test('it should fail when latitude & longitude are out of range', () => {
        const validationCall = () =>
            validateRequestSchema<CalculateRouteParams>(
                {
                    locations: [
                        [200, 180],
                        [-200, -180],
                    ],
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                routeRequestValidationConfig,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message: expect.stringContaining('Invalid input'),
                issues: expect.arrayContaining([
                    expect.objectContaining({
                        origin: 'number',
                        code: 'too_big',
                        maximum: 180,
                        path: ['locations', 0, 0],
                    }),
                    expect.objectContaining({
                        origin: 'number',
                        code: 'too_big',
                        maximum: 90,
                        path: ['locations', 0, 1],
                    }),
                    expect.objectContaining({
                        origin: 'number',
                        code: 'too_small',
                        minimum: -180,
                        path: ['locations', 1, 0],
                    }),
                    expect.objectContaining({
                        origin: 'number',
                        code: 'too_small',
                        minimum: -90,
                        path: ['locations', 1, 1],
                    }),
                ]),
            }),
        );
    });

    test('it should fail when format of location is incorrect - example 1', () => {
        const validationCall = () =>
            validateRequestSchema<CalculateRouteParams>(
                { locations: '4.89066,52.37317:4.49015,52.16109' as never, apiKey, commonBaseURL: commonBaseUrl },
                routeRequestValidationConfig,
            );
        expect(validationCall).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['locations'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when there are not enough waypoints - none sent', () => {
        expect(() =>
            validateRequestSchema(
                { locations: [], apiKey, commonBaseURL: commonBaseUrl },
                routeRequestValidationConfig,
            ),
        ).toThrow('Invalid input');
    });

    test('it should fail when there are not enough waypoints - one sent', () => {
        expect(() =>
            validateRequestSchema(
                { locations: [[4.89066, 52.37317]], apiKey, commonBaseURL: commonBaseUrl },
                routeRequestValidationConfig,
            ),
        ).toThrow(
            'When passing waypoints only: at least 2 must be defined. If passing also paths, at least one path must be defined',
        );
    });

    test('it should fail when locations param is missing', () => {
        expect(() =>
            validateRequestSchema<CalculateRouteParams>(
                { apiKey, commonBaseURL: commonBaseUrl } as never,
                routeRequestValidationConfig,
            ),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'array',
                        path: ['locations'],
                        message: 'Invalid input',
                    },
                ],
            }),
        );
    });

    test('it should fail when format of optional params are incorrect', () => {
        const validationCall = () =>
            validateRequestSchema<CalculateRouteParams>(
                {
                    locations: [
                        [4.89066, 52.37317],
                        [4.4906, 51.37317],
                    ],
                    costModel: {
                        avoid: 'tollRoads' as never,
                        traffic: true as never,
                        // TODO not supported in Orbis
                        // thrillingParams: {
                        //     hilliness: "low",
                        //     windingness: "medium" as never
                        // }
                    },
                    computeAdditionalTravelTimeFor: 'first' as never,
                    vehicle: {
                        state: {
                            heading: 360,
                        },
                    },
                    maxAlternatives: 6 as never,
                    // TODO deprecated in Orbis
                    // routeRepresentation: "summary" as never,
                    travelMode: 2 as never,
                    sectionTypes: ['tunnel', 'motorways'] as never,
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                routeRequestValidationConfig,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([
                    expect.objectContaining({
                        expected: 'array',
                        code: 'invalid_type',
                        path: ['costModel', 'avoid'],
                        message: 'Invalid input',
                    }),
                    expect.objectContaining({
                        code: 'invalid_value',
                        values: ['live', 'historical'],
                        path: ['costModel', 'traffic'],
                        message: 'Invalid input',
                    }),
                    expect.objectContaining({
                        expected: 'string',
                        code: 'invalid_type',
                        path: ['travelMode'],
                        message: 'Invalid input',
                    }),
                    expect.objectContaining({
                        code: 'invalid_value',
                        values: ['none', 'all'],
                        path: ['computeAdditionalTravelTimeFor'],
                        message: 'Invalid input',
                    }),
                    expect.objectContaining({
                        origin: 'number',
                        code: 'too_big',
                        maximum: 5,
                        inclusive: true,
                        path: ['maxAlternatives'],
                        message: 'Invalid input',
                    }),
                    expect.objectContaining({
                        code: 'invalid_value',
                        values: expect.arrayContaining(inputSectionTypes),
                        path: ['sectionTypes', 1],
                        message: 'Invalid input',
                    }),
                ]),
            }),
        );
    });
});

describe('Calculate route request schema performance tests', () => {
    test('Calculate route request with many waypoints, mandatory & optional params', () => {
        expect(
            bestExecutionTimeMS(
                () => validateRequestSchema<CalculateRouteParams>(routeRequestParams, routeRequestValidationConfig),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.routing.schemaValidation);
    });
});
