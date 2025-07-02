import { ValidationError } from '../validation';
import type { VehicleParameters } from '../index';
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
                errors: [
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        message: 'Expected number, received string',
                        path: ['dimensions', 'weightKG'],
                        received: 'string',
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
        ).toThrow("Invalid discriminator value. Expected 'combustion' | 'electric'");
    });

    test('it should fail when format of efficiency within vehicle consumption is incorrect', () => {
        expect(() =>
            validate({
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
            }),
        ).toThrow(
            expect.objectContaining({
                errors: expect.arrayContaining([
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'consumption', 'efficiency', 'acceleration'],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'too_big',
                        maximum: 1,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be less than or equal to 1',
                        path: ['engine', 'model', 'consumption', 'efficiency', 'deceleration'],
                    },
                    {
                        code: 'too_small',
                        minimum: 0,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be greater than or equal to 0',
                        path: ['engine', 'model', 'consumption', 'efficiency', 'uphill'],
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'consumption', 'efficiency', 'downhill'],
                        message: 'Expected number, received string',
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
                errors: expect.arrayContaining([
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'consumption', 'speedsToConsumptionsKWH', 0, 'speedKMH'],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: [
                            'engine',
                            'model',
                            'consumption',
                            'speedsToConsumptionsKWH',
                            1,
                            'consumptionUnitsPer100KM',
                        ],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'consumption', 'auxiliaryPowerInkW'],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'too_big',
                        maximum: 500,
                        type: 'number',
                        inclusive: true,
                        exact: false,
                        message: 'Number must be less than or equal to 500',
                        path: ['engine', 'model', 'consumption', 'consumptionInKWHPerKMAltitudeGain'],
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'consumption', 'recuperationInKWHPerKMAltitudeLoss'],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'currentChargePCT'],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'charging', 'maxChargeKWH'],
                        message: 'Expected number, received string',
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
                errors: expect.arrayContaining([
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'consumption', 'speedsToConsumptionsLiters', 0, 'speedKMH'],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: [
                            'engine',
                            'model',
                            'consumption',
                            'speedsToConsumptionsLiters',
                            1,
                            'consumptionUnitsPer100KM',
                        ],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'consumption', 'auxiliaryPowerInLitersPerHour'],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'model', 'consumption', 'fuelEnergyDensityInMJoulesPerLiter'],
                        message: 'Expected number, received string',
                    },
                    {
                        code: 'invalid_type',
                        expected: 'number',
                        received: 'string',
                        path: ['engine', 'currentFuelInLiters'],
                        message: 'Expected number, received string',
                    },
                ]),
            }),
        );
    });
});
