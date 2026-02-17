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
    speedKMH: z.number().describe('Speed in kilometers per hour'),
    consumptionUnitsPer100KM: z.number().describe('Consumption rate per 100 kilometers'),
});

// Efficiency schema for consumption models
const efficiencySchema = z
    .object({
        acceleration: optionalNormalizedNumber.describe('Acceleration efficiency factor (0-1)'),
        deceleration: optionalNormalizedNumber.describe('Deceleration efficiency factor (0-1)'),
        uphill: optionalNormalizedNumber.describe('Uphill efficiency factor (0-1)'),
        downhill: optionalNormalizedNumber.describe('Downhill efficiency factor (0-1)'),
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
    speedsToConsumptionsLiters: speedConsumptionArray.describe(
        'Array of speed-to-fuel-consumption mappings in liters per 100km',
    ),
    auxiliaryPowerInLitersPerHour: optionalNonNegativeNumber.describe('Auxiliary power consumption in liters per hour'),
    fuelEnergyDensityInMJoulesPerLiter: z
        .number()
        .min(1)
        .optional()
        .describe('Fuel energy density in megajoules per liter'),
});

// Electric consumption model schema
const electricConsumptionModelSchema = z.object({
    ...baseConsumptionModelSchema,
    speedsToConsumptionsKWH: speedConsumptionArray.describe(
        'Array of speed-to-energy-consumption mappings in kWh per 100km',
    ),
    auxiliaryPowerInkW: optionalNonNegativeNumber.describe('Auxiliary power consumption in kilowatts'),
    consumptionInKWHPerKMAltitudeGain: z
        .number()
        .max(500)
        .optional()
        .describe('Energy consumption per kilometer of altitude gain in kWh'),
    recuperationInKWHPerKMAltitudeLoss: optionalNonNegativeNumber.describe(
        'Energy recuperation per kilometer of altitude loss in kWh',
    ),
});

// Charging connector schema
const chargingConnectorSchema = z.object({
    currentType: z.enum(currentTypes).describe('Type of electrical current (AC or DC)'),
    plugTypes: z.array(z.enum(plugTypes)).min(1).describe('Compatible plug/connector types'),
    efficiency: optionalNormalizedNumber.describe('Charging efficiency factor (0-1)'),
    baseLoadInkW: optionalNonNegativeNumber.describe('Base load in kilowatts'),
    maxPowerInkW: optionalNonNegativeNumber.describe('Maximum charging power in kilowatts'),
    maxVoltageInV: optionalNonNegativeNumber.describe('Maximum voltage in volts'),
    maxCurrentInA: optionalNonNegativeNumber.describe('Maximum current in amperes'),
    voltageRange: z
        .object({
            minVoltageInV: optionalNonNegativeNumber.describe('Minimum voltage in volts'),
            maxVoltageInV: z.number().optional().describe('Maximum voltage in volts'),
        })
        .optional()
        .describe('Acceptable voltage range'),
});

// Battery curve schema
const batteryCurveSchema = z.object({
    stateOfChargeInkWh: nonNegativeNumber.describe('State of charge in kilowatt-hours'),
    maxPowerInkW: positiveNumber.describe('Maximum charging power at this state of charge in kilowatts'),
});

// Charging model schema
const chargingModelSchema = z.object({
    maxChargeKWH: positiveNumber.describe('Maximum battery capacity in kilowatt-hours'),
    batteryCurve: z
        .array(batteryCurveSchema)
        .max(20)
        .optional()
        .describe('Battery charging curve with up to 20 data points'),
    chargingConnectors: z
        .array(chargingConnectorSchema)
        .min(1)
        .optional()
        .describe('Available charging connectors on the vehicle'),
    chargingTimeOffsetInSec: optionalNonNegativeNumber.describe('Time offset for charging start in seconds'),
});

// Engine model schemas
const combustionEngineModelSchema = z.object({
    consumption: combustionConsumptionModelSchema.describe('Fuel consumption model for combustion engine'),
});
const electricEngineModelSchema = z.object({
    consumption: electricConsumptionModelSchema.describe('Energy consumption model for electric engine'),
    charging: chargingModelSchema.optional().describe('Battery and charging specifications'),
});

// Vehicle dimensions schema
const vehicleDimensionsSchema = z
    .object({
        lengthMeters: optionalPositiveNumber.describe('Vehicle length in meters'),
        widthMeters: optionalPositiveNumber.describe('Vehicle width in meters'),
        heightMeters: optionalPositiveNumber.describe('Vehicle height in meters'),
        weightKG: optionalPositiveNumber.describe('Vehicle weight in kilograms'),
        axleWeightKG: optionalPositiveNumber.describe('Vehicle axle weight in kilograms'),
    })
    .optional();

// Vehicle model schemas
const predefinedVehicleModelSchema = z.object({
    variantId: z.string().describe('Predefined vehicle variant identifier'),
});
const explicitVehicleModelSchema = z.object({
    dimensions: vehicleDimensionsSchema.describe('Physical dimensions and weight of the vehicle'),
    engine: z
        .union([combustionEngineModelSchema, electricEngineModelSchema])
        .optional()
        .describe('Engine type and consumption characteristics'),
});
const vehicleModelSchema = z.union([predefinedVehicleModelSchema, explicitVehicleModelSchema]).optional();

// Vehicle state schemas
const genericVehicleStateSchema = z.object({
    heading: z.number().min(0).max(360).optional().describe('Current vehicle heading in degrees (0-360)'),
});

const combustionVehicleStateSchema = genericVehicleStateSchema.extend({
    currentFuelInLiters: nonNegativeNumber.describe('Current fuel level in liters'),
});

const electricVehicleStateByPercentageSchema = genericVehicleStateSchema.extend({
    currentChargePCT: percentageNumber.describe('Current battery charge as percentage (0-100)'),
});

const electricVehicleStateByKwhSchema = genericVehicleStateSchema.extend({
    currentChargeInkWh: nonNegativeNumber.describe('Current battery charge in kilowatt-hours'),
});

const electricVehicleStateSchema = z.union([electricVehicleStateByPercentageSchema, electricVehicleStateByKwhSchema]);

// Charging preferences schemas
const chargingPreferencesPCTSchema = z.object({
    minChargeAtDestinationPCT: percentageNumber.describe(
        'Minimum battery charge percentage required at destination (0-100)',
    ),
    minChargeAtChargingStopsPCT: z
        .number()
        .min(0)
        .max(50)
        .describe('Minimum battery charge percentage at charging stops (0-50)'),
});

const chargingPreferencesKWHSchema = z.object({
    minChargeAtDestinationInkWh: nonNegativeNumber.describe('Minimum battery charge in kWh required at destination'),
    minChargeAtChargingStopsInkWh: nonNegativeNumber.describe('Minimum battery charge in kWh at charging stops'),
});

const chargingPreferencesSchema = z.union([chargingPreferencesPCTSchema, chargingPreferencesKWHSchema]);
const electricVehiclePreferencesSchema = z.object({
    chargingPreferences: chargingPreferencesSchema
        .optional()
        .describe('Preferences for charging stops along the route'),
});

// Vehicle restrictions schema
const vehicleRestrictionsSchema = z
    .object({
        loadTypes: z
            .array(z.enum(loadTypes))
            .optional()
            .describe('Types of hazardous or restricted loads being carried'),
        maxSpeedKMH: z
            .number()
            .min(0)
            .max(250)
            .optional()
            .describe('Maximum vehicle speed in kilometers per hour (0-250)'),
        adrCode: z
            .enum(['B', 'C', 'D', 'E'])
            .optional()
            .describe('ADR tunnel restriction code for hazardous materials'),
        commercial: z.boolean().optional().describe('Whether the vehicle is used for commercial purposes'),
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
    state: genericVehicleStateSchema.optional().describe('Current state of the vehicle'),
    preferences: z.object({}).optional().describe('Vehicle preferences'),
});

const combustionVehicleParamsSchema = z.object({
    ...baseVehicleParamsSchema,
    engineType: z.literal('combustion').describe('Combustion engine type'),
    state: combustionVehicleStateSchema
        .optional()
        .describe('Current state of the combustion vehicle including fuel level'),
    preferences: z.object({}).optional().describe('Combustion vehicle preferences'),
});

const electricVehicleParamsSchema = z.object({
    ...baseVehicleParamsSchema,
    engineType: z.literal('electric').describe('Electric engine type'),
    state: electricVehicleStateSchema
        .optional()
        .describe('Current state of the electric vehicle including battery charge'),
    preferences: electricVehiclePreferencesSchema
        .optional()
        .describe('Electric vehicle preferences including charging requirements'),
});

/**
 * @ignore
 */
export const vehicleParametersSchema = z.union([
    z.discriminatedUnion('engineType', [combustionVehicleParamsSchema, electricVehicleParamsSchema]),
    genericVehicleParamsSchema,
]);
