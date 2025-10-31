import { currentTypes, plugTypes } from '@tomtom-org/maps-sdk/core';
import { z } from 'zod/v4-mini';
import { loadTypes } from '../types/vehicleRestrictionParams';

// Common validation schemas
const positiveNumber = z.number().check(z.positive());
const nonNegativeNumber = z.number().check(z.minimum(0));
const percentageNumber = z.number().check(z.minimum(0), z.maximum(100));

// Common optional schemas
const optionalPositiveNumber = z.optional(positiveNumber);
const optionalNonNegativeNumber = z.optional(nonNegativeNumber);
const optionalNormalizedNumber = z.optional(z.number().check(z.minimum(0), z.maximum(1)));

// Speed to consumption rate schema
const speedToConsumptionRateSchema = z.object({
    speedKMH: z.number(),
    consumptionUnitsPer100KM: z.number(),
});

// Efficiency schema for consumption models
const efficiencySchema = z.optional(
    z.object({
        acceleration: optionalNormalizedNumber,
        deceleration: optionalNormalizedNumber,
        uphill: optionalNormalizedNumber,
        downhill: optionalNormalizedNumber,
    }),
);

// Base consumption model schema
const baseConsumptionModelSchema = {
    efficiency: efficiencySchema,
};

// Consumption array validation
const speedConsumptionArray = z.array(speedToConsumptionRateSchema).check(z.minLength(1), z.maxLength(25));

// Combustion consumption model schema
const combustionConsumptionModelSchema = z.object({
    ...baseConsumptionModelSchema,
    speedsToConsumptionsLiters: speedConsumptionArray,
    auxiliaryPowerInLitersPerHour: optionalNonNegativeNumber,
    fuelEnergyDensityInMJoulesPerLiter: z.optional(z.number().check(z.minimum(1))),
});

// Electric consumption model schema
const electricConsumptionModelSchema = z.object({
    ...baseConsumptionModelSchema,
    speedsToConsumptionsKWH: speedConsumptionArray,
    auxiliaryPowerInkW: optionalNonNegativeNumber,
    consumptionInKWHPerKMAltitudeGain: z.optional(z.number().check(z.maximum(500))),
    recuperationInKWHPerKMAltitudeLoss: optionalNonNegativeNumber,
});

// Charging connector schema
const chargingConnectorSchema = z.object({
    currentType: z.enum(currentTypes),
    plugTypes: z.array(z.enum(plugTypes)).check(z.minLength(1)),
    efficiency: optionalNormalizedNumber,
    baseLoadInkW: optionalNonNegativeNumber,
    maxPowerInkW: optionalNonNegativeNumber,
    maxVoltageInV: optionalNonNegativeNumber,
    maxCurrentInA: optionalNonNegativeNumber,
    voltageRange: z.optional(
        z.object({
            minVoltageInV: optionalNonNegativeNumber,
            maxVoltageInV: z.optional(z.number()),
        }),
    ),
});

// Battery curve schema
const batteryCurveSchema = z.object({
    stateOfChargeInkWh: nonNegativeNumber,
    maxPowerInkW: positiveNumber,
});

// Charging model schema
const chargingModelSchema = z.object({
    maxChargeKWH: positiveNumber,
    batteryCurve: z.optional(z.array(batteryCurveSchema).check(z.maxLength(20))),
    chargingConnectors: z.optional(z.array(chargingConnectorSchema).check(z.minLength(1))),
    chargingTimeOffsetInSec: optionalNonNegativeNumber,
});

// Engine model schemas
const combustionEngineModelSchema = z.object({ consumption: combustionConsumptionModelSchema });
const electricEngineModelSchema = z.object({
    consumption: electricConsumptionModelSchema,
    charging: z.optional(chargingModelSchema),
});

// Vehicle dimensions schema
const vehicleDimensionsSchema = z.optional(
    z.object({
        lengthMeters: optionalPositiveNumber,
        widthMeters: optionalPositiveNumber,
        heightMeters: optionalPositiveNumber,
        weightKG: optionalPositiveNumber,
        axleWeightKG: optionalPositiveNumber,
    }),
);

// Vehicle model schemas
const predefinedVehicleModelSchema = z.object({ variantId: z.string() });
const explicitVehicleModelSchema = z.object({
    dimensions: vehicleDimensionsSchema,
    engine: z.optional(z.union([combustionEngineModelSchema, electricEngineModelSchema])),
});
const vehicleModelSchema = z.optional(z.union([predefinedVehicleModelSchema, explicitVehicleModelSchema]));

// Vehicle state schemas
const genericVehicleStateSchema = z.object({
    heading: z.optional(z.number().check(z.minimum(0), z.maximum(360))),
});

const combustionVehicleStateSchema = z.extend(
    genericVehicleStateSchema,
    z.object({ currentFuelInLiters: nonNegativeNumber }).shape,
);

const electricVehicleStateByPercentageSchema = z.extend(
    genericVehicleStateSchema,
    z.object({ currentChargePCT: percentageNumber }).shape,
);

const electricVehicleStateByKwhSchema = z.extend(
    genericVehicleStateSchema,
    z.object({ currentChargeInkWh: nonNegativeNumber }).shape,
);

const electricVehicleStateSchema = z.union([electricVehicleStateByPercentageSchema, electricVehicleStateByKwhSchema]);

// Charging preferences schemas
const chargingPreferencesPCTSchema = z.object({
    minChargeAtDestinationPCT: percentageNumber,
    minChargeAtChargingStopsPCT: z.number().check(z.minimum(0), z.maximum(50)),
});

const chargingPreferencesKWHSchema = z.object({
    minChargeAtDestinationInkWh: nonNegativeNumber,
    minChargeAtChargingStopsInkWh: nonNegativeNumber,
});

const chargingPreferencesSchema = z.union([chargingPreferencesPCTSchema, chargingPreferencesKWHSchema]);
const electricVehiclePreferencesSchema = z.object({
    chargingPreferences: z.optional(chargingPreferencesSchema),
});

// Vehicle restrictions schema
const vehicleRestrictionsSchema = z.optional(
    z.object({
        loadTypes: z.optional(z.array(z.enum(loadTypes))),
        maxSpeedKMH: z.optional(z.number().check(z.minimum(0), z.maximum(250))),
        adrCode: z.optional(z.enum(['B', 'C', 'D', 'E'])),
        commercial: z.optional(z.boolean()),
    }),
);

// Base vehicle parameters schema
const baseVehicleParamsSchema = {
    model: vehicleModelSchema,
    restrictions: vehicleRestrictionsSchema,
};

// Vehicle parameters schemas
const genericVehicleParamsSchema = z.object({
    ...baseVehicleParamsSchema,
    engineType: z.undefined(),
    state: z.optional(genericVehicleStateSchema),
    preferences: z.optional(z.object({})),
});

const combustionVehicleParamsSchema = z.object({
    ...baseVehicleParamsSchema,
    engineType: z.literal('combustion'),
    state: z.optional(combustionVehicleStateSchema),
    preferences: z.optional(z.object({})),
});

const electricVehicleParamsSchema = z.object({
    ...baseVehicleParamsSchema,
    engineType: z.literal('electric'),
    state: z.optional(electricVehicleStateSchema),
    preferences: z.optional(electricVehiclePreferencesSchema),
});

/**
 * @ignore
 */
export const vehicleParametersSchema = z.union([
    z.discriminatedUnion('engineType', [combustionVehicleParamsSchema, electricVehicleParamsSchema]),
    genericVehicleParamsSchema,
]);
