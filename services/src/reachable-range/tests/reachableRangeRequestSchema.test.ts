import { describe, expect, test } from 'vitest';
import { validateRequestSchema } from '../../shared/validation';
import { reachableRangeRequestValidationConfig } from '../reachableRangeRequestSchema';
import type { ReachableRangeParams } from '../types/reachableRangeParams';

describe.skip('Reachable range request schema validation', () => {
    const apiKey = 'APIKEY';
    const commonBaseUrl = 'https://api-test.tomtom.com';
    const config = reachableRangeRequestValidationConfig;

    test("it should fail when api Key isn't defined", () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                { budget: { type: 'timeMinutes', value: 30 }, origin: [10, 20], commonBaseURL: commonBaseUrl },
                config,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message: 'Invalid input',
                issues: [expect.objectContaining({ path: ['apiKey'] })],
            }),
        );
    });

    test("it should fail when common base URL isn't defined", () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                { budget: { type: 'timeMinutes', value: 30 }, origin: [10, 20], apiKey },
                config,
            );

        expect(validationCall).toThrow(expect.objectContaining({ message: 'Invalid input' }));
    });

    test("it should fail when origin isn't defined", () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                { budget: { type: 'timeMinutes', value: 30 }, apiKey, commonBaseURL: commonBaseUrl } as never,
                config,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message: 'Invalid input',
                issues: [expect.objectContaining({ path: ['origin'] })],
            }),
        );
    });

    test("it should fail when origin isn't well defined", () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                {
                    origin: 'wrong' as never,
                    budget: { type: 'timeMinutes', value: 30 },
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                config,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message: 'Invalid input',
                issues: [expect.objectContaining({ path: ['origin'] })],
            }),
        );
    });

    test("it should fail when budget isn't defined", () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                { origin: [10, 20], apiKey, commonBaseURL: commonBaseUrl } as never,
                config,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message: 'Invalid input',
                issues: [expect.objectContaining({ path: ['budget'] })],
            }),
        );
    });

    test('it should fail when trying to input arrival time (only departAt allowed)', () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                {
                    origin: [10, 20],
                    budget: { type: 'distanceKM', value: 100 },
                    when: {
                        option: 'arriveBy' as never,
                        date: new Date(),
                    },
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                config,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message:
                    'When calculating a reachable range, departure date-time can be specified, ' +
                    'but not arrival date-time',
            }),
        );
    });

    test("it should fail when budget is EV but vehicle params aren't defined", () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                {
                    origin: [10, 20],
                    budget: { type: 'remainingChargeCPT', value: 50 },
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                config,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message: 'Invalid input',
            }),
        );
    });

    test("it should fail when budget is EV but vehicle params aren't fully defined", () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                {
                    origin: [10, 20],
                    budget: { type: 'remainingChargeCPT', value: 50 },
                    // vehicle: {
                    //     // model missing:
                    //     engine: { type: "electric", currentChargePCT: 50 } as never
                    // },
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                config,
            );

        expect(validationCall).toThrow(
            // (More detailed tests done in scope of vehicle params validation itself)
            expect.objectContaining({ message: 'Invalid input' }),
        );
    });

    test('it should fail when budget is EV but vehicle params are for combustion', () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                {
                    origin: [10, 20],
                    budget: { type: 'remainingChargeCPT', value: 50 },
                    // vehicle: {
                    //     engine: {
                    //         type: "combustion",
                    //         currentFuelInLiters: 60,
                    //         model: {
                    //             consumption: {
                    //                 speedsToConsumptionsLiters: [{ speedKMH: 100, consumptionUnitsPer100KM: 6 }]
                    //             }
                    //         }
                    //     }
                    // },
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                config,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message: 'Invalid input',
            }),
        );
    });

    test("it should fail when budget is about fuel but vehicle params aren't defined", () => {
        const validationCall = () =>
            validateRequestSchema<ReachableRangeParams>(
                {
                    origin: [10, 20],
                    budget: { type: 'spentFuelLiters', value: 35 },
                    apiKey,
                    commonBaseURL: commonBaseUrl,
                },
                config,
            );

        expect(validationCall).toThrow(
            expect.objectContaining({
                message:
                    "With a fuel reachable range, the vehicle parameters must be set, with 'combustion' engine type",
            }),
        );
    });
});
