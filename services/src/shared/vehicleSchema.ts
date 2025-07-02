import { z } from 'zod/v4-mini';
import { currentTypes, plugTypes } from '@anw/maps-sdk-js/core';

const efficiencySchema = z.partial(
    z.object({
        efficiency: z.partial(
            z.object({
                acceleration: z.number().check(z.minimum(0), z.maximum(1)),
                deceleration: z.number().check(z.minimum(0), z.maximum(1)),
                uphill: z.number().check(z.minimum(0), z.maximum(1)),
                downhill: z.number().check(z.minimum(0), z.maximum(1)),
            }),
        ),
    }),
);

const combustionModelSchema = z.object({
    consumption: z.extend(
        efficiencySchema,
        z.object({
            speedsToConsumptionsLiters: z.optional(
                z.array(
                    z.object({
                        speedKMH: z.number(),
                        consumptionUnitsPer100KM: z.number(),
                    }),
                ),
            ),
            auxiliaryPowerInLitersPerHour: z.optional(z.number()),
            fuelEnergyDensityInMJoulesPerLiter: z.optional(z.number()),
        }),
    ),
});

const chargingConnectorSchema = z.object({
    currentType: z.enum(currentTypes),
    plugTypes: z.array(z.enum(plugTypes)).check(z.minLength(1)),
    efficiency: z.optional(z.number()),
    baseLoadInkW: z.optional(z.number()),
    maxPowerInkW: z.optional(z.number()),
    maxVoltageInV: z.optional(z.number()),
    maxCurrentInA: z.optional(z.number()),
    voltageRange: z.optional(
        z.object({
            minVoltageInV: z.optional(z.number()),
            maxVoltageInV: z.optional(z.number()),
        }),
    ),
});

const batteryCurveSchema = z.object({
    stateOfChargeInkWh: z.number().check(z.minimum(0)),
    maxPowerInkW: z.number().check(z.positive()),
});

const electricEngineModelSchema = z.object({
    consumption: z.extend(
        efficiencySchema,
        z.object({
            speedsToConsumptionsKWH: z.optional(
                z.array(
                    z.object({
                        speedKMH: z.number(),
                        consumptionUnitsPer100KM: z.number(),
                    }),
                ),
            ),
            auxiliaryPowerInkW: z.optional(z.number()),
            consumptionInKWHPerKMAltitudeGain: z.optional(z.number().check(z.maximum(500))),
            recuperationInKWHPerKMAltitudeLoss: z.optional(z.number()),
        }),
    ),
    charging: z.optional(
        z.object({
            maxChargeKWH: z.number(),
            batteryCurve: z.optional(z.array(batteryCurveSchema)),
            connectors: z.optional(z.array(chargingConnectorSchema).check(z.minLength(1))),
        }),
    ),
});

const combustionEngineSchema = z.object({
    type: z.literal('combustion'),
    currentFuelInLiters: z.number(),
    model: combustionModelSchema,
});

const pct = z.number().check(z.minimum(0), z.maximum(100));

const electricEngineSchema = z.object({
    type: z.literal('electric'),
    currentChargePCT: pct,
    model: electricEngineModelSchema,
    chargingPreferences: z.optional(
        z.object({
            minChargeAtDestinationPCT: pct,
            minChargeAtChargingStopsPCT: pct,
        }),
    ),
});

const vehicleDimensionsSchema = z.partial(
    z.object({
        lengthMeters: z.number(),
        widthMeters: z.number(),
        heightMeters: z.number(),
        weightKG: z.number(),
        axleWeightKG: z.number(),
    }),
);

/**
 * @ignore
 */
export const vehicleParametersSchema = z.partial(
    z.object({
        engine: z.discriminatedUnion('type', [combustionEngineSchema, electricEngineSchema]),
        dimensions: vehicleDimensionsSchema,
        loadTypes: z.array(z.string()),
        maxSpeedKMH: z.number().check(z.minimum(0), z.maximum(250)),
        adrCode: z.enum(['B', 'C', 'D', 'E']),
        commercial: z.boolean(),
    }),
);
