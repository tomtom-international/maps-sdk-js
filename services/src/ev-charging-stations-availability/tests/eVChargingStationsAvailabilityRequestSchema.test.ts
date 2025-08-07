import { bestExecutionTimeMS } from 'core/src/util/tests/performanceTestUtils';
import { describe, expect, test } from 'vitest';
import { MAX_EXEC_TIMES_MS } from '../../shared/tests/perfConfig';
import { validateRequestSchema } from '../../shared/validation';
import { evChargingStationsAvailabilityRequestSchema } from '../evChargingStationsAvailabilityRequestSchema';
import type { ChargingStationsAvailabilityParams } from '../types/evChargingStationsAvailabilityParams';

describe('EV Charging Stations availability schema validation', () => {
    const apiKey = 'APIKEY';
    const commonBaseUrl = 'https://api-test.tomtom.com';

    test('it should fail when id is an invalid param', () => {
        const invalidParams: ChargingStationsAvailabilityParams = {
            //@ts-ignore
            id: 555,
            apiKey,
            commonBaseURL: commonBaseUrl,
        };

        expect(() =>
            validateRequestSchema(invalidParams, { schema: evChargingStationsAvailabilityRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        expected: 'string',
                        code: 'invalid_type',
                        path: ['id'],
                        message: 'Invalid input',
                    }),
                ],
            }),
        );
    });

    test('it should fail when connectorTypes is invalid and id is missing', () => {
        const invalidParams: ChargingStationsAvailabilityParams = {
            apiKey,
            commonBaseURL: commonBaseUrl,
        } as never;
        expect(() =>
            validateRequestSchema(invalidParams, { schema: evChargingStationsAvailabilityRequestSchema }),
        ).toThrow(
            expect.objectContaining({
                issues: [
                    expect.objectContaining({
                        code: 'invalid_type',
                        expected: 'string',
                        message: 'Invalid input',
                        path: ['id'],
                    }),
                ],
            }),
        );
    });
});

describe('EV charging stations availability request schema performance tests', () => {
    test('EV charging stations availability request schema performance test', async () => {
        expect(
            bestExecutionTimeMS(
                () =>
                    validateRequestSchema(
                        {
                            apiKey: 'APIKEY',
                            commonBaseURL: 'https://api.tomtom.com',
                            language: 'en-GB',
                            id: '528009002413828',
                        },
                        {
                            schema: evChargingStationsAvailabilityRequestSchema,
                        },
                    ),
                10,
            ),
        ).toBeLessThan(MAX_EXEC_TIMES_MS.ev.schemaValidation);
    });
});
