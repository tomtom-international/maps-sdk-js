import { describe, expect, test } from 'vitest';
import type { VehicleParameters } from '../index';
import { loadTypes } from '../types/vehicleRestrictionParams';
import { ValidationError } from '../validation';
import { vehicleParametersSchema } from '../vehicleParamsSchema';

const validate = (params: VehicleParameters): void => {
    const validation = vehicleParametersSchema.safeParse(params);
    if (!validation.success) {
        throw new ValidationError(validation.error);
    }
};

describe('Routing: Vehicle parameter schema expected failures', () => {
    test('it should fail when format of vehicle dimensions are incorrect', async () => {
        expect(() => validate({ model: { dimensions: { weightKG: '1900' as never } } })).toThrow(ValidationError);
    });

    test('it should fail when incorrect engine type is specified', () => {
        expect(() =>
            validate({
                engineType: 'EV' as never,
                state: {
                    currentChargePCT: 20,
                },
            }),
        ).toThrow(ValidationError);
    });

    test('it should fail when format of efficiency within vehicle consumption is incorrect', () => {
        const validationInput = {
            engineType: 'electric',
            state: {
                currentChargePCT: 50,
            },
            model: {
                engine: {
                    consumption: {
                        speedsToConsumptionsKWH: [
                            { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                            { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                        ],
                        auxiliaryPowerInkW: 1.7,
                        efficiency: {
                            acceleration: '0.66' as never,
                            deceleration: 1.2,
                            uphill: 1.5, // Should fail as max is 1
                            downhill: '0.73' as never,
                        },
                    },
                },
            },
        } as VehicleParameters;

        expect(() => validate(validationInput)).toThrow(ValidationError);
    });

    test('it should fail when format of electric consumption model is incorrect', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                state: {
                    currentChargePCT: '50' as never,
                },
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: '50' as never, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: '21.3' as never },
                            ],
                            auxiliaryPowerInkW: '1.7' as never,
                            consumptionInKWHPerKMAltitudeGain: 501, // This should fail as max is 500
                            recuperationInKWHPerKMAltitudeLoss: '3.8' as never,
                            efficiency: {
                                acceleration: 0.66,
                                deceleration: 0.91,
                                uphill: 0.74,
                                downhill: 0.73,
                            },
                        },
                        charging: { maxChargeKWH: '85' as never },
                    },
                },
            }),
        ).toThrow(ValidationError);
    });

    test('should fail when format of combustion consumption model is incorrect', () => {
        expect(() =>
            validate({
                engineType: 'combustion',
                state: {
                    currentFuelInLiters: '43' as never,
                },
                model: {
                    engine: {
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
        ).toThrow(ValidationError);
    });

    test('should pass with valid electric vehicle parameters', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                state: {
                    currentChargePCT: 50,
                },
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                            ],
                            auxiliaryPowerInkW: 1.7,
                            consumptionInKWHPerKMAltitudeGain: 400,
                            recuperationInKWHPerKMAltitudeLoss: 3.8,
                            efficiency: {
                                acceleration: 0.66,
                                deceleration: 0.91,
                                uphill: 0.74,
                                downhill: 0.73,
                            },
                        },
                        charging: { maxChargeKWH: 85 },
                    },
                },
            }),
        ).not.toThrow();
    });

    test('should pass with valid combustion vehicle parameters', () => {
        expect(() =>
            validate({
                engineType: 'combustion',
                state: {
                    currentFuelInLiters: 43,
                },
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsLiters: [
                                { speedKMH: 50, consumptionUnitsPer100KM: 8.2 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 21.3 },
                            ],
                            auxiliaryPowerInLitersPerHour: 1.7,
                            fuelEnergyDensityInMJoulesPerLiter: 35.8,
                        },
                    },
                },
            }),
        ).not.toThrow();
    });

    test('should fail when efficiency values are out of range', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                state: {
                    currentChargePCT: 50,
                },
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [{ speedKMH: 50, consumptionUnitsPer100KM: 8.2 }],
                            efficiency: {
                                acceleration: -0.1, // Invalid: below 0
                                deceleration: 1.5, // Invalid: above 1
                            },
                        },
                    },
                },
            }),
        ).toThrow(ValidationError);
    });

    test('should pass with valid generic vehicle parameters (no engine type)', () => {
        expect(() =>
            validate({
                model: {
                    dimensions: {
                        lengthMeters: 4.5,
                        widthMeters: 1.8,
                        heightMeters: 1.6,
                        weightKG: 1500,
                    },
                },
                restrictions: {
                    maxSpeedKMH: 130,
                    commercial: true,
                },
            }),
        ).not.toThrow();
    });

    test('should pass with valid predefined vehicle model', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                model: {
                    variantId: 'tesla-model-3',
                },
                state: {
                    currentChargePCT: 80,
                },
            }),
        ).not.toThrow();
    });

    test('should fail with invalid restrictions', () => {
        expect(() =>
            validate({
                model: {
                    dimensions: {
                        weightKG: 1500,
                    },
                },
                restrictions: {
                    maxSpeedKMH: 300, // Invalid: above 250 max
                    loadTypes: ['InvalidLoadType' as never],
                },
            }),
        ).toThrow(ValidationError);
    });
});

describe('Routing: Vehicle parameter schema successful validations', () => {
    test('should pass with minimal valid electric vehicle parameters', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                state: {
                    currentChargePCT: 50,
                },
            }),
        ).not.toThrow();
    });

    test('should pass with predefined vehicle model and minimal state', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                model: {
                    variantId: 'nissan-leaf-2023',
                },
                state: { currentChargeInkWh: 65 },
            }),
        ).not.toThrow();
    });

    test('should pass with electric vehicle model ID', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                model: { variantId: '54B969E8-E28D-11EC-8FEA-0242AC120002' },
                state: { currentChargeInkWh: 25 },
                preferences: {
                    chargingPreferences: { minChargeAtDestinationInkWh: 5, minChargeAtChargingStopsInkWh: 5 },
                },
            }),
        ).not.toThrow();
    });

    test('should pass with minimal valid combustion vehicle parameters', () => {
        expect(() =>
            validate({
                engineType: 'combustion',
                state: {
                    currentFuelInLiters: 30,
                },
            }),
        ).not.toThrow();
    });

    test('should pass with complete electric vehicle configuration', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                state: {
                    currentChargePCT: 75,
                },
                model: {
                    dimensions: {
                        lengthMeters: 4.2,
                        widthMeters: 1.9,
                        heightMeters: 1.5,
                        weightKG: 1800,
                    },
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [
                                { speedKMH: 30, consumptionUnitsPer100KM: 15.5 },
                                { speedKMH: 90, consumptionUnitsPer100KM: 18.2 },
                                { speedKMH: 120, consumptionUnitsPer100KM: 25.8 },
                            ],
                            auxiliaryPowerInkW: 2.1,
                            consumptionInKWHPerKMAltitudeGain: 250,
                            recuperationInKWHPerKMAltitudeLoss: 2.5,
                            efficiency: {
                                acceleration: 0.8,
                                deceleration: 0.9,
                                uphill: 0.7,
                                downhill: 0.85,
                            },
                        },
                        charging: { maxChargeKWH: 100 },
                    },
                },
                restrictions: {
                    maxSpeedKMH: 180,
                    commercial: false,
                    loadTypes: ['otherHazmatExplosive'],
                },
            }),
        ).not.toThrow();
    });

    test('should pass with complete combustion vehicle configuration', () => {
        expect(() =>
            validate({
                engineType: 'combustion',
                state: {
                    currentFuelInLiters: 55,
                },
                model: {
                    dimensions: {
                        lengthMeters: 5.1,
                        widthMeters: 2.0,
                        heightMeters: 1.8,
                        weightKG: 2200,
                    },
                    engine: {
                        consumption: {
                            speedsToConsumptionsLiters: [
                                { speedKMH: 40, consumptionUnitsPer100KM: 6.8 },
                                { speedKMH: 80, consumptionUnitsPer100KM: 7.5 },
                                { speedKMH: 130, consumptionUnitsPer100KM: 12.3 },
                            ],
                            auxiliaryPowerInLitersPerHour: 0.8,
                            fuelEnergyDensityInMJoulesPerLiter: 34.2,
                        },
                    },
                },
                restrictions: {
                    maxSpeedKMH: 200,
                    commercial: true,
                    loadTypes: ['otherHazmatHarmfulToWater', 'USHazmatClass3'],
                },
            }),
        ).not.toThrow();
    });

    test('should pass with vehicle dimensions only (no engine specifics)', () => {
        expect(() =>
            validate({
                model: {
                    dimensions: {
                        lengthMeters: 3.8,
                        widthMeters: 1.6,
                        heightMeters: 1.4,
                        weightKG: 1200,
                    },
                },
            }),
        ).not.toThrow();
    });

    test('should pass with valid efficiency values at boundaries', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                state: {
                    currentChargePCT: 40,
                },
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [{ speedKMH: 60, consumptionUnitsPer100KM: 16.7 }],
                            efficiency: {
                                acceleration: 0.0, // Valid: at minimum boundary
                                deceleration: 1.0, // Valid: at maximum boundary
                                uphill: 0.5,
                                downhill: 0.5,
                            },
                        },
                    },
                },
            }),
        ).not.toThrow();
    });

    test('should pass with maximum allowed altitude consumption values', () => {
        expect(() =>
            validate({
                engineType: 'electric',
                state: {
                    currentChargePCT: 90,
                },
                model: {
                    engine: {
                        consumption: {
                            speedsToConsumptionsKWH: [{ speedKMH: 70, consumptionUnitsPer100KM: 14.2 }],
                            consumptionInKWHPerKMAltitudeGain: 500, // At maximum boundary
                            recuperationInKWHPerKMAltitudeLoss: 10.0, // Valid value
                        },
                    },
                },
            }),
        ).not.toThrow();
    });

    test('should pass with maximum allowed speed restriction', () => {
        expect(() =>
            validate({
                model: {
                    dimensions: {
                        weightKG: 1600,
                    },
                },
                restrictions: {
                    maxSpeedKMH: 250, // At maximum boundary
                    commercial: false,
                },
            }),
        ).not.toThrow();
    });

    test('should pass with all valid load types', () => {
        expect(() =>
            validate({
                model: {
                    dimensions: {
                        weightKG: 2500,
                    },
                },
                restrictions: {
                    loadTypes: [...loadTypes],
                    commercial: true,
                },
            }),
        ).not.toThrow();
    });

    test('should pass with empty parameters object', () => {
        expect(() => validate({})).not.toThrow();
    });
});
