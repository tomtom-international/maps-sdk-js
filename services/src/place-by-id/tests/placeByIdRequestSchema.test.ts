import type { Language } from '@anw/maps-sdk-js/core';
import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import placeByIdReqObjects from '../../place-by-id/tests/requestBuilderPerf.data.json';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { validateRequestSchema } from '../../shared/validation';
import { placeByIdRequestSchema } from '../placeByIdSchema';
import type { PlaceByIdParams } from '../types';

describe('Place By Id API', () => {
    const apiKey = 'APIKEY';
    const commonBaseUrl = 'https://api-test.tomtom.com';
    const entityId = 528009004250472; // Invalid value, entityId is a string
    const language: Language = 'en-GB';
    const view = 'Unified';
    const timeZone = 'iana';
    const openingHours = 'nextSevenDays';

    test('it should throw Validation error with invalid entityId', () => {
        const invalidParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
            entityId,
            language,
            view,
            timeZone,
            openingHours,
        };

        expect(() => validateRequestSchema(invalidParams, { schema: placeByIdRequestSchema })).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        received: 'number',
                        path: ['entityId'],
                        message: 'Expected string, received number',
                    },
                ],
            }),
        );
    });

    test('it should throw Validation error when missing entityId', () => {
        expect(() =>
            validateRequestSchema(
                {
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                    language,
                    view,
                    timeZone,
                    openingHours,
                },
                { schema: placeByIdRequestSchema },
            ),
        ).toThrow(
            expect.objectContaining({
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'string',
                        received: 'undefined',
                        path: ['entityId'],
                        message: 'Required',
                    },
                ],
            }),
        );
    });
});

describe('PlaceById request schema performance tests', () => {
    test('PlaceById request schema performance test', () => {
        expect(
            bestExecutionTimeMS(
                () => validateRequestSchema(placeByIdReqObjects as PlaceByIdParams, { schema: placeByIdRequestSchema }),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.placeById.schemaValidation);
    });
});
