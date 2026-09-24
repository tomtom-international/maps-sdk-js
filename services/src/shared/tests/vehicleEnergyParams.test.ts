import { describe, expect, test } from 'vitest';
import {
    appendEnergyParams,
    chargingPreferenceParams,
    combustionConsumptionParams,
    currentChargeParams,
    currentFuelParams,
    efficiencyParams,
    electricConsumptionParams,
    maxChargeKWHOf,
    maxChargeParams,
    setEnergyParams,
} from '../request/vehicleEnergyParams';
import type { ElectricEngineModel } from '../types/vehicleEngineParams';
import type { VehicleParameters } from '../types/vehicleParams';
import type { ChargingPreferences } from '../types/vehiclePreferences';
import type { ElectricVehicleState } from '../types/vehicleState';

const electricEngine = (maxChargeKWH?: number): ElectricEngineModel => ({
    consumption: { speedsToConsumptionsKWH: [{ speedKMH: 90, consumptionUnitsPer100KM: 18 }] },
    ...(maxChargeKWH === undefined ? {} : { charging: { maxChargeKWH } }),
});

const electricVehicle = (
    parts: { maxChargeKWH?: number; state?: ElectricVehicleState; chargingPreferences?: ChargingPreferences } = {},
): VehicleParameters => ({
    engineType: 'electric',
    model: { engine: electricEngine(parts.maxChargeKWH) },
    state: parts.state,
    preferences: { chargingPreferences: parts.chargingPreferences },
});

describe('efficiencyParams', () => {
    test('yields nothing when the vehicle declares no efficiency', () => {
        expect(efficiencyParams()).toStrictEqual({});
    });

    test('names each efficiency after the axis it applies to', () => {
        expect(
            efficiencyParams({ acceleration: 0.66, deceleration: 0.91, uphill: 0.74, downhill: 0.73 }),
        ).toStrictEqual({
            accelerationEfficiency: '0.66',
            decelerationEfficiency: '0.91',
            uphillEfficiency: '0.74',
            downhillEfficiency: '0.73',
        });
    });

    test('keeps a zero efficiency, which is a declared value rather than an absence', () => {
        expect(efficiencyParams({ downhill: 0 })).toStrictEqual({ downhillEfficiency: '0' });
    });
});

describe('electricConsumptionParams', () => {
    test('joins the consumption curve into speed,rate pairs', () => {
        const parameters = electricConsumptionParams({
            speedsToConsumptionsKWH: [
                { speedKMH: 50, consumptionUnitsPer100KM: 15 },
                { speedKMH: 120, consumptionUnitsPer100KM: 23 },
            ],
        });

        expect(parameters.constantSpeedConsumptionInkWhPerHundredkm).toBe('50,15:120,23');
    });

    test('omits the curve entirely when the caller supplied an empty one', () => {
        expect(electricConsumptionParams({ speedsToConsumptionsKWH: [] })).toStrictEqual({});
    });

    test('carries the auxiliary, altitude and efficiency figures alongside the curve', () => {
        expect(
            electricConsumptionParams({
                speedsToConsumptionsKWH: [{ speedKMH: 90, consumptionUnitsPer100KM: 18 }],
                auxiliaryPowerInkW: 1.7,
                consumptionInKWHPerKMAltitudeGain: 34.6,
                recuperationInKWHPerKMAltitudeLoss: 22.1,
                efficiency: { uphill: 0.74 },
            }),
        ).toStrictEqual({
            constantSpeedConsumptionInkWhPerHundredkm: '90,18',
            auxiliaryPowerInkW: '1.7',
            consumptionInkWhPerkmAltitudeGain: '34.6',
            recuperationInkWhPerkmAltitudeLoss: '22.1',
            uphillEfficiency: '0.74',
        });
    });
});

describe('combustionConsumptionParams', () => {
    test('joins the consumption curve and carries the fuel figures', () => {
        expect(
            combustionConsumptionParams({
                consumption: {
                    speedsToConsumptionsLiters: [
                        { speedKMH: 50, consumptionUnitsPer100KM: 6.3 },
                        { speedKMH: 130, consumptionUnitsPer100KM: 11.5 },
                    ],
                    auxiliaryPowerInLitersPerHour: 0.2,
                    fuelEnergyDensityInMJoulesPerLiter: 34.2,
                },
            }),
        ).toStrictEqual({
            constantSpeedConsumptionInLitersPerHundredkm: '50,6.3:130,11.5',
            auxiliaryPowerInLitersPerHour: '0.2',
            fuelEnergyDensityInMJoulesPerLiter: '34.2',
        });
    });

    test('omits the curve entirely when the caller supplied an empty one', () => {
        expect(combustionConsumptionParams({ consumption: { speedsToConsumptionsLiters: [] } })).toStrictEqual({});
    });
});

describe('maxChargeKWHOf', () => {
    test('reads the capacity off an explicitly described electric model', () => {
        expect(maxChargeKWHOf(electricVehicle({ maxChargeKWH: 75 }))).toBe(75);
    });

    test('finds no capacity on a predefined model, whose battery the service holds', () => {
        const vehicle: VehicleParameters = {
            engineType: 'electric',
            model: { variantId: 'tesla-model-3-long-range-2023' },
            preferences: { chargingPreferences: { minChargeAtDestinationPCT: 20, minChargeAtChargingStopsPCT: 10 } },
        };

        expect(maxChargeKWHOf(vehicle)).toBeUndefined();
    });

    test('finds no capacity on a vehicle without a model', () => {
        expect(maxChargeKWHOf({ engineType: 'electric' })).toBeUndefined();
    });
});

describe('maxChargeParams', () => {
    test('sends the declared battery capacity', () => {
        expect(maxChargeParams(electricEngine(75))).toStrictEqual({ maxChargeInkWh: '75' });
    });

    test('sends nothing for an engine with no charging model', () => {
        expect(maxChargeParams(electricEngine())).toStrictEqual({});
    });
});

describe('currentChargeParams', () => {
    test('passes an absolute charge straight through', () => {
        expect(currentChargeParams(electricVehicle({ state: { currentChargeInkWh: 50 } }))).toStrictEqual({
            currentChargeInkWh: '50',
        });
    });

    test('converts a percentage against the battery capacity', () => {
        expect(
            currentChargeParams(electricVehicle({ maxChargeKWH: 75, state: { currentChargePCT: 80 } })),
        ).toStrictEqual({ currentChargeInkWh: '60' });
    });

    test('yields nothing for a percentage with no capacity to convert against', () => {
        expect(currentChargeParams(electricVehicle({ state: { currentChargePCT: 80 } }))).toStrictEqual({});
    });
});

describe('currentFuelParams', () => {
    test('passes the tank level through', () => {
        const vehicle: VehicleParameters = { engineType: 'combustion', state: { currentFuelInLiters: 45 } };

        expect(currentFuelParams(vehicle)).toStrictEqual({ currentFuelInLiters: '45' });
    });

    test('reports an empty tank rather than treating it as unknown', () => {
        const vehicle: VehicleParameters = { engineType: 'combustion', state: { currentFuelInLiters: 0 } };

        expect(currentFuelParams(vehicle)).toStrictEqual({ currentFuelInLiters: '0' });
    });

    test('yields nothing for a vehicle that reports no state', () => {
        expect(currentFuelParams({ engineType: 'combustion' })).toStrictEqual({});
    });
});

describe('chargingPreferenceParams', () => {
    test('yields nothing for a vehicle that asked for no charging stops', () => {
        expect(chargingPreferenceParams(electricVehicle())).toStrictEqual({});
    });

    test('passes absolute minimum charges straight through', () => {
        expect(
            chargingPreferenceParams(
                electricVehicle({
                    chargingPreferences: { minChargeAtDestinationInkWh: 15, minChargeAtChargingStopsInkWh: 10 },
                }),
            ),
        ).toStrictEqual({ minChargeAtDestinationInkWh: '15', minChargeAtChargingStopsInkWh: '10' });
    });

    test('sends only the absolute minimum it was given', () => {
        // The type requires both, so only an untyped caller reaches this — which is exactly the
        // caller that used to receive the other field back as the string `undefined`.
        const preferences = { minChargeAtChargingStopsInkWh: 10 } as ChargingPreferences;

        expect(chargingPreferenceParams(electricVehicle({ chargingPreferences: preferences }))).toStrictEqual({
            minChargeAtChargingStopsInkWh: '10',
        });
    });

    test('converts percentages against the battery capacity', () => {
        expect(
            chargingPreferenceParams(
                electricVehicle({
                    maxChargeKWH: 75,
                    chargingPreferences: { minChargeAtDestinationPCT: 20, minChargeAtChargingStopsPCT: 10 },
                }),
            ),
        ).toStrictEqual({ minChargeAtDestinationInkWh: '15', minChargeAtChargingStopsInkWh: '7.5' });
    });

    test('yields nothing for percentages with no capacity to convert against', () => {
        expect(
            chargingPreferenceParams(
                electricVehicle({
                    chargingPreferences: { minChargeAtDestinationPCT: 20, minChargeAtChargingStopsPCT: 10 },
                }),
            ),
        ).toStrictEqual({});
    });
});

describe('writing the parameters onto a query', () => {
    test('appendEnergyParams leaves an existing entry of the same name in place', () => {
        const urlParams = new URLSearchParams({ maxChargeInkWh: '40' });
        appendEnergyParams(urlParams, { maxChargeInkWh: '75' });

        expect(urlParams.getAll('maxChargeInkWh')).toStrictEqual(['40', '75']);
    });

    test('setEnergyParams replaces an existing entry of the same name', () => {
        const urlParams = new URLSearchParams({ maxChargeInkWh: '40' });
        setEnergyParams(urlParams, { maxChargeInkWh: '75' });

        expect(urlParams.getAll('maxChargeInkWh')).toStrictEqual(['75']);
    });
});
