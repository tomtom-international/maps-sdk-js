import type { VehicleParameters } from '@tomtom-org/maps-sdk/services';

/** The three settings the panel drives. Everything else about the vehicle is fixed. */
export type ChargingPreferences = {
    /** Fixed time at every charging stop, on top of the charging itself. */
    chargingTimeOffsetInSec: number;
    /** How full the battery is charged at each stop, as a percentage of `maxChargeKWH`. */
    minChargeAtChargingStopsPCT: number;
    /** How much charge is left on arrival, as a percentage of `maxChargeKWH`. */
    minChargeAtDestinationPCT: number;
};

// A 40 kWh vehicle setting off with a nearly full battery, so the route has to stop to charge.
export const buildVehicle = (preferences: ChargingPreferences): VehicleParameters => ({
    engineType: 'electric',
    // Knowing `maxChargeKWH` below is what lets the charge state and preferences be percentages.
    state: { currentChargePCT: 80 },
    preferences: {
        chargingPreferences: {
            minChargeAtChargingStopsPCT: preferences.minChargeAtChargingStopsPCT,
            minChargeAtDestinationPCT: preferences.minChargeAtDestinationPCT,
        },
    },
    model: {
        engine: {
            charging: {
                maxChargeKWH: 40,
                batteryCurve: [
                    { stateOfChargeInkWh: 10, maxPowerInkW: 150 },
                    { stateOfChargeInkWh: 30, maxPowerInkW: 100 },
                    { stateOfChargeInkWh: 38, maxPowerInkW: 40 },
                ],
                chargingConnectors: [
                    {
                        currentType: 'AC3',
                        plugTypes: ['IEC_62196_Type_2_Outlet', 'IEC_62196_Type_2_Connector_Cable_Attached'],
                        efficiency: 0.9,
                        baseLoadInkW: 0.2,
                        maxPowerInkW: 11,
                    },
                    {
                        currentType: 'DC',
                        plugTypes: ['IEC_62196_Type_2_Outlet', 'Combo_to_IEC_62196_Type_2_Base'],
                        voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
                        efficiency: 0.9,
                        baseLoadInkW: 0.2,
                        maxPowerInkW: 150,
                    },
                ],
                // The one the panel is really about: it is added to every charging stop, and the
                // response reports it inside that stop's `chargingTimeInSeconds`.
                chargingTimeOffsetInSec: preferences.chargingTimeOffsetInSec,
            },
            consumption: {
                speedsToConsumptionsKWH: [
                    { speedKMH: 32, consumptionUnitsPer100KM: 10.87 },
                    { speedKMH: 77, consumptionUnitsPer100KM: 18.01 },
                ],
            },
        },
    },
});
