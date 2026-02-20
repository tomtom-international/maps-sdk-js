import type { BudgetType, VehicleParameters } from '@tomtom-org/maps-sdk/services';

/**
 * Sample vehicle profiles used for budget types that require engine data.
 * These are illustrative only — replace them with real specs for your use case.
 */

export const EXAMPLE_EV: VehicleParameters = {
    engineType: 'electric',
    model: {
        engine: {
            consumption: {
                speedsToConsumptionsKWH: [
                    { speedKMH: 50, consumptionUnitsPer100KM: 14 },
                    { speedKMH: 90, consumptionUnitsPer100KM: 17 },
                    { speedKMH: 120, consumptionUnitsPer100KM: 22 },
                ],
            },
            charging: { maxChargeKWH: 75 },
        },
    },
    state: { currentChargePCT: 80 },
};

export const EXAMPLE_COMBUSTION: VehicleParameters = {
    engineType: 'combustion',
    model: {
        engine: {
            consumption: {
                fuelEnergyDensityInMJoulesPerLiter: 34.2,
                speedsToConsumptionsLiters: [
                    { speedKMH: 50, consumptionUnitsPer100KM: 6.5 },
                    { speedKMH: 90, consumptionUnitsPer100KM: 5.5 },
                    { speedKMH: 120, consumptionUnitsPer100KM: 7.5 },
                ],
            },
        },
    },
    state: { currentFuelInLiters: 40 },
};

/** Budget types that require vehicle engine data to produce meaningful results. */
export const VEHICLE_BUDGET_TYPES = new Set<BudgetType>(['remainingChargeCPT', 'spentChargePCT', 'spentFuelLiters']);

export const getVehicleForBudgetType = (type: BudgetType): VehicleParameters | undefined => {
    if (type === 'remainingChargeCPT' || type === 'spentChargePCT') {
        return EXAMPLE_EV;
    }
    if (type === 'spentFuelLiters') {
        return EXAMPLE_COMBUSTION;
    }
    return undefined;
};
