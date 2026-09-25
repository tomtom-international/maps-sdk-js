import type { VehicleParameters } from '@tomtom-org/maps-sdk/services';

// A 60 kWh vehicle starting at 80%, which cannot cross the Alps in one go — so the service plans
// the charging stops and reports how long the car sits at each one.
export const EV_VEHICLE: VehicleParameters = {
    engineType: 'electric',
    state: { currentChargePCT: 80 },
    preferences: {
        chargingPreferences: {
            minChargeAtChargingStopsPCT: 20,
            minChargeAtDestinationPCT: 20,
        },
    },
    model: {
        engine: {
            charging: {
                maxChargeKWH: 60,
                batteryCurve: [
                    { stateOfChargeInkWh: 15, maxPowerInkW: 150 },
                    { stateOfChargeInkWh: 45, maxPowerInkW: 100 },
                    { stateOfChargeInkWh: 57, maxPowerInkW: 40 },
                ],
                chargingConnectors: [
                    {
                        currentType: 'DC',
                        plugTypes: ['IEC_62196_Type_2_Outlet', 'Combo_to_IEC_62196_Type_2_Base'],
                        voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
                        efficiency: 0.9,
                        baseLoadInkW: 0.2,
                        maxPowerInkW: 150,
                    },
                ],
            },
            consumption: {
                speedsToConsumptionsKWH: [
                    { speedKMH: 32, consumptionUnitsPer100KM: 12.1 },
                    { speedKMH: 77, consumptionUnitsPer100KM: 19.4 },
                ],
            },
        },
    },
};
