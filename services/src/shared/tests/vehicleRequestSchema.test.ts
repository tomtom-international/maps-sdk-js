import { describe, expect, test } from 'vitest';
import type { VehicleParameters } from '../index';
import { ValidationError } from '../validation';
import { vehicleParametersSchema } from '../vehicleSchema';

describe('Routing: Vehicle parameter request schema tests', () => {
    const validate = (params: VehicleParameters): void => {
        const validation = vehicleParametersSchema.safeParse(params);
        if (!validation.success) {
            throw new ValidationError(validation.error);
        }
    };

    test('it should fail when format of vehicle dimensions are incorrect', async () => {
        expect(() => validate({ dimensions: { weightKG: '1900' as never } })).toThrow(
            expect.objectContaining({
                issues: [
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        message: 'Invalid input',
                        path: ['dimensions', 'weightKG'],
                    },
                ],
            }),
        );
    });

    test('it should fail when incorrect engine type is specified', () => {
        expect(() =>
            validate({
                dimensions: {
                    weightKG: 1900,
                },
                engine: {
                    type: 'EV' as never,
                    currentChargePCT: 20,
                    model: {
                        charging: { maxChargeKWH: 85 },
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                            ],
                            auxiliaryPowerInkW: 1.7,
                            efficiency: {
                                acceleration: 0.66,
                                deceleration: 0.91,
                                uphill: 0.74,
                                downhill: 0.73,
                            },
                        },
                    },
                },
            }),
        ).toThrow('✖ Invalid input\n  → at engine.type');
    });

    test('it should fail when format of efficiency within vehicle consumption is incorrect', () => {
        const validationInput = {
            engine: {
                type: 'electric',
                currentChargePCT: 50,
                model: {
                    charging: { maxChargeKWH: 85 },
                    consumption: {
                        speedsToConsumptionsKWH: [
                            { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                            { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                        ],
                        auxiliaryPowerInkW: 1.7,
                        efficiency: {
                            acceleration: '0.66' as never,
                            deceleration: 1.2,
                            uphill: -0.1,
                            downhill: '0.73' as never,
                        },
                    },
                },
            },
        } as VehicleParameters;

        expect(() => validate(validationInput)).toThrow(
            expect.objectContaining({
                message: expect.stringMatching(/acceleration[\s\S]*deceleration[\s\S]*uphill[\s\S]*downhill/),
                issues: expect.arrayContaining([
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'consumption', 'efficiency', 'acceleration'],
                        message: 'Invalid input',
                    },
                    {
                        code: 'too_big',
                        maximum: 1,
                        origin: 'number',
                        inclusive: true,
                        message: 'Invalid input',
                        path: ['engine', 'model', 'consumption', 'efficiency', 'deceleration'],
                    },
                    {
                        code: 'too_small',
                        minimum: 0,
                        origin: 'number',
                        inclusive: true,
                        message: 'Invalid input',
                        path: ['engine', 'model', 'consumption', 'efficiency', 'uphill'],
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'consumption', 'efficiency', 'downhill'],
                        message: 'Invalid input',
                    },
                ]),
            }),
        );
    });

    test('it should fail when format of electric consumption model is incorrect', () => {
        expect(() =>
            validate({
                engine: {
                    type: 'electric',
                    currentChargePCT: '50' as never,
                    model: {
                        charging: { maxChargeKWH: '85' as never },
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: '50' as never, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: '21.3' as never },
                            ],
                            auxiliaryPowerInkW: '1.7' as never,
                            consumptionInKWHPerKMAltitudeGain: 501,
                            recuperationInKWHPerKMAltitudeLoss: '3.8' as never,
                            efficiency: {
                                acceleration: 0.66,
                                deceleration: 0.91,
                                uphill: 0.74,
                                downhill: 0.73,
                            },
                        },
                    },
                },
            }),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'consumption', 'speedsToConsumptionsKWH', 0, 'speedKMH'],
                        message: 'Invalid input',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: [
                            'engine',
                            'model',
                            'consumption',
                            'speedsToConsumptionsKWH',
                            1,
                            'consumptionUnitsPer100KM',
                        ],
                        message: 'Invalid input',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'consumption', 'auxiliaryPowerInkW'],
                        message: 'Invalid input',
                    },
                    {
                        code: 'too_big',
                        maximum: 500,
                        origin: 'number',
                        inclusive: true,
                        message: 'Invalid input',
                        path: ['engine', 'model', 'consumption', 'consumptionInKWHPerKMAltitudeGain'],
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'consumption', 'recuperationInKWHPerKMAltitudeLoss'],
                        message: 'Invalid input',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'currentChargePCT'],
                        message: 'Invalid input',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'charging', 'maxChargeKWH'],
                        message: 'Invalid input',
                    },
                ]),
            }),
        );
    });

    test('should fail when format of combustion consumption model is incorrect', () => {
        expect(() =>
            validate({
                engine: {
                    type: 'combustion',
                    currentFuelInLiters: '43' as never,
                    model: {
                        consumption: {
                            speedsToConsumptionsLiters: [
                                { speedKMH: '50' as never, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: '21.3' as never },
                            ],
                            auxiliaryPowerInLitersPerHour: '1.7' as never,
                            fuelEnergyDensityInMJoulesPerLiter: '85' as never,
                        },
                    },
                },
            }),
        ).toThrow(
            expect.objectContaining({
                issues: expect.arrayContaining([
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'consumption', 'speedsToConsumptionsLiters', 0, 'speedKMH'],
                        message: 'Invalid input',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: [
                            'engine',
                            'model',
                            'consumption',
                            'speedsToConsumptionsLiters',
                            1,
                            'consumptionUnitsPer100KM',
                        ],
                        message: 'Invalid input',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'consumption', 'auxiliaryPowerInLitersPerHour'],
                        message: 'Invalid input',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'model', 'consumption', 'fuelEnergyDensityInMJoulesPerLiter'],
                        message: 'Invalid input',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        path: ['engine', 'currentFuelInLiters'],
                        message: 'Invalid input',
                    },
                ]),
            }),
        );
    });
});
