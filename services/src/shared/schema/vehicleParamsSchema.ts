import { currentTypes, plugTypes } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod';
import { loadTypes } from '../types/vehicleRestrictionParams';

// Common validation schemas
const positiveNumber = z.number().positive();
const nonNegativeNumber = z.number().min(0);
const percentageNumber = z.number().min(0).max(100);

// Common optional schemas
const optionalPositiveNumber = positiveNumber.optional();
const optionalNonNegativeNumber = nonNegativeNumber.optional();
const optionalNormalizedNumber = z.number().min(0).max(1).optional();

// Speed to consumption rate schema
const speedToConsumptionRateSchema = z.object({
    speedKMH: z.number(),
    consumptionUnitsPer100KM: z.number(),
});

// Efficiency schema for consumption models
const efficiencySchema = z
    .object({
        acceleration: optionalNormalizedNumber,
        deceleration: optionalNormalizedNumber,
        uphill: optionalNormalizedNumber,
        downhill: optionalNormalizedNumber,
    })
    .optional();

// Base consumption model schema
const baseConsumptionModelSchema = {
    efficiency: efficiencySchema,
};

// Consumption array validation
const speedConsumptionArray = z.array(speedToConsumptionRateSchema).min(1).max(25);

// Combustion consumption model schema
const combustionConsumptionModelSchema = z.object({
    ...baseConsumptionModelSchema,
    speedsToConsumptionsLiters: speedConsumptionArray,
    auxiliaryPowerInLitersPerHour: optionalNonNegativeNumber,
    fuelEnergyDensityInMJoulesPerLiter: z.number().min(1).optional(),
});

// Electric consumption model schema
const electricConsumptionModelSchema = z.object({
    ...baseConsumptionModelSchema,
    speedsToConsumptionsKWH: speedConsumptionArray,
    auxiliaryPowerInkW: optionalNonNegativeNumber,
    consumptionInKWHPerKMAltitudeGain: z.number().max(500).optional(),
    recuperationInKWHPerKMAltitudeLoss: optionalNonNegativeNumber,
});

// Charging connector schema
const chargingConnectorSchema = z.object({
    currentType: z.enum(currentTypes),
    plugTypes: z.array(z.enum(plugTypes)).min(1),
    efficiency: optionalNormalizedNumber,
    baseLoadInkW: optionalNonNegativeNumber,
    maxPowerInkW: optionalNonNegativeNumber,
    maxVoltageInV: optionalNonNegativeNumber,
    maxCurrentInA: optionalNonNegativeNumber,
    voltageRange: z
        .object({
            minVoltageInV: optionalNonNegativeNumber,
            maxVoltageInV: z.number().optional(),
        })
        .optional(),
});

// Battery curve schema
const batteryCurveSchema = z.object({
    stateOfChargeInkWh: nonNegativeNumber,
    maxPowerInkW: positiveNumber,
});

// Charging model schema
const chargingModelSchema = z.object({
    maxChargeKWH: positiveNumber,
    batteryCurve: z.array(batteryCurveSchema).max(20).optional(),
    chargingConnectors: z.array(chargingConnectorSchema).min(1).optional(),
    chargingTimeOffsetInSec: optionalNonNegativeNumber,
});

// Engine model schemas
const combustionEngineModelSchema = z.object({ consumption: combustionConsumptionModelSchema });
const electricEngineModelSchema = z.object({
    consumption: electricConsumptionModelSchema,
    charging: chargingModelSchema.optional(),
});

// Vehicle dimensions schema
const vehicleDimensionsSchema = z
    .object({
        lengthMeters: optionalPositiveNumber,
        widthMeters: optionalPositiveNumber,
        heightMeters: optionalPositiveNumber,
        weightKG: optionalPositiveNumber,
        axleWeightKG: optionalPositiveNumber,
    })
    .optional();

// Vehicle model schemas
const predefinedVehicleModelSchema = z.object({ variantId: z.string() });
const explicitVehicleModelSchema = z.object({
    dimensions: vehicleDimensionsSchema,
    engine: z.union([combustionEngineModelSchema, electricEngineModelSchema]).optional(),
});
const vehicleModelSchema = z.union([predefinedVehicleModelSchema, explicitVehicleModelSchema]).optional();

// Vehicle state schemas
const genericVehicleStateSchema = z.object({
    heading: z.number().min(0).max(360).optional(),
});

const combustionVehicleStateSchema = genericVehicleStateSchema.extend({
    currentFuelInLiters: nonNegativeNumber,
});

const electricVehicleStateByPercentageSchema = genericVehicleStateSchema.extend({
    currentChargePCT: percentageNumber,
});

const electricVehicleStateByKwhSchema = genericVehicleStateSchema.extend({
    currentChargeInkWh: nonNegativeNumber,
});

const electricVehicleStateSchema = z.union([electricVehicleStateByPercentageSchema, electricVehicleStateByKwhSchema]);

// Charging preferences schemas
const chargingPreferencesPCTSchema = z.object({
    minChargeAtDestinationPCT: percentageNumber,
    minChargeAtChargingStopsPCT: z.number().min(0).max(50),
});

const chargingPreferencesKWHSchema = z.object({
    minChargeAtDestinationInkWh: nonNegativeNumber,
    minChargeAtChargingStopsInkWh: nonNegativeNumber,
});

const chargingPreferencesSchema = z.union([chargingPreferencesPCTSchema, chargingPreferencesKWHSchema]);
const electricVehiclePreferencesSchema = z.object({
    chargingPreferences: chargingPreferencesSchema.optional(),
});

// Vehicle restrictions schema
const vehicleRestrictionsSchema = z
    .object({
        loadTypes: z.array(z.enum(loadTypes)).optional(),
        maxSpeedKMH: z.number().min(0).max(250).optional(),
        adrCode: z.enum(['B', 'C', 'D', 'E']).optional(),
        commercial: z.boolean().optional(),
    })
    .optional();

// Base vehicle parameters schema
const baseVehicleParamsSchema = {
    model: vehicleModelSchema,
    restrictions: vehicleRestrictionsSchema,
};

// Vehicle parameters schemas
const genericVehicleParamsSchema = z.object({
    ...baseVehicleParamsSchema,
    engineType: z.undefined(),
    state: genericVehicleStateSchema.optional(),
    preferences: z.object({}).optional(),
});

const combustionVehicleParamsSchema = z.object({
    ...baseVehicleParamsSchema,
    engineType: z.literal('combustion'),
    state: combustionVehicleStateSchema.optional(),
    preferences: z.object({}).optional(),
});

const electricVehicleParamsSchema = z.object({
    ...baseVehicleParamsSchema,
    engineType: z.literal('electric'),
    state: electricVehicleStateSchema.optional(),
    preferences: electricVehiclePreferencesSchema.optional(),
});

/**
 * @ignore
 */
export const vehicleParametersSchema = z.union([
    z.discriminatedUnion('engineType', [combustionVehicleParamsSchema, electricVehicleParamsSchema]),
    genericVehicleParamsSchema,
]);
