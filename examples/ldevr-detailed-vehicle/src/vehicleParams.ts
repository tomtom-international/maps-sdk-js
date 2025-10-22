import type { VehicleParameters } from '@cet/maps-sdk-js/services';

export const vehicle: VehicleParameters = {
    engineType: 'electric',
    // We can express chargings in % because we know maxChargeKWH below:
    state: { currentChargePCT: 80 },
    preferences: {
        chargingPreferences: { minChargeAtDestinationPCT: 50, minChargeAtChargingStopsPCT: 10 },
    },
    model: {
        engine: {
            charging: {
                // Knowing the max charge allows the charging state and preferences to be expressed in PCT (%):
                maxChargeKWH: 40,
                batteryCurve: [
                    { stateOfChargeInkWh: 50, maxPowerInkW: 200 },
                    { stateOfChargeInkWh: 70, maxPowerInkW: 100 },
                    { stateOfChargeInkWh: 80, maxPowerInkW: 40 },
                ],
                chargingConnectors: [
                    {
                        currentType: 'AC3',
                        plugTypes: [
                            'IEC_62196_Type_2_Outlet',
                            'IEC_62196_Type_2_Connector_Cable_Attached',
                            'Combo_to_IEC_62196_Type_2_Base',
                        ],
                        efficiency: 0.9,
                        baseLoadInkW: 0.2,
                        maxPowerInkW: 11,
                    },
                    {
                        currentType: 'DC',
                        plugTypes: [
                            'IEC_62196_Type_2_Outlet',
                            'IEC_62196_Type_2_Connector_Cable_Attached',
                            'Combo_to_IEC_62196_Type_2_Base',
                        ],
                        voltageRange: { minVoltageInV: 0, maxVoltageInV: 500 },
                        efficiency: 0.9,
                        baseLoadInkW: 0.2,
                        maxPowerInkW: 150,
                    },
                    {
                        currentType: 'DC',
                        plugTypes: [
                            'IEC_62196_Type_2_Outlet',
                            'IEC_62196_Type_2_Connector_Cable_Attached',
                            'Combo_to_IEC_62196_Type_2_Base',
                        ],
                        voltageRange: { minVoltageInV: 500, maxVoltageInV: 2000 },
                        efficiency: 0.9,
                        baseLoadInkW: 0.2,
                    },
                ],
                chargingTimeOffsetInSec: 60,
            },
            consumption: {
                speedsToConsumptionsKWH: [
                    { speedKMH: 32, consumptionUnitsPer100KM: 10.87 },
                    { speedKMH: 77, consumptionUnitsPer100KM: 18.01 },
                ],
            },
        },
    },
};
